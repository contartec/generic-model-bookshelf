'use strict'

const GenericModel = require('../lib/GenericModel')

const GenericClass = require('./models/GenericClass')
const GenericClassRelated = require('./models/GenericClassRelated')

const QueryBuilderUtils = require('../lib/utils/QueryBuilderUtils')

const GenericRelatedPersistedMock = require('./mocks/GenericRelatedPersistedMock')
const GenericClassMock = require('./mocks/GenericClassMock')

describe('GenericModel', () => {
  let genericModel, defaultObject, organization, genericClass

  before(function*() {
    organization = yield GenericRelatedPersistedMock
      .insertDefault()

    genericClass = yield GenericClassMock
      .insertDefault({
        organization_id: organization.id
      })

    defaultObject = createGenericClassMock(organization.id)

    genericModel = new GenericModel(GenericClass.DEFAULT_ATTRIBUTES, defaultObject)
  })

  function createGenericClassMock(organizationId) {
    return GenericClassMock
      .createObject({
        organization_id : organizationId || organization.id,
        enrollment      : `Enrollment ${Math.round(Math.random() * 999)}`
      })
  }

  describe('#constructor', () => {
    it('should return an object of type GenericModel', () => {
      expect(genericModel).to.be.instanceOf(GenericModel)
    })

    it('should set "tableName"', () => {
      const tableName = GenericClass.DEFAULT_ATTRIBUTES.tableName

      expect(genericModel.tableName).to.eql(tableName)
    })

    it('should set "hasTimestamps"', () => {
      const hasTimestamps = GenericClass.DEFAULT_ATTRIBUTES.hasTimestamps

      expect(genericModel.hasTimestamps).to.eql(hasTimestamps)
    })

    it('should set "id"', () => {
      const id = GenericClass.DEFAULT_ATTRIBUTES.id

      expect(genericModel.id).to.eql(id)
    })

    it('should set "visible"', () => {
      const visible = GenericClass.DEFAULT_ATTRIBUTES.visible

      expect(genericModel.visible).to.eql(visible)
    })

    it('should set "hidden"', () => {
      const hidden = GenericClass.DEFAULT_ATTRIBUTES.hidden

      expect(genericModel.hidden).to.eql(hidden)
    })

    it('should set "relateds"', () => {
      const relateds = GenericClass.DEFAULT_ATTRIBUTES.relateds

      expect(genericModel.relateds).to.eql(relateds)
    })

    it('should set "constraints"', () => {
      const constraints = GenericClass.DEFAULT_ATTRIBUTES.constraints

      expect(genericModel.constraints).to.eql(constraints)
    })

    it('should set "id"', () => {
      const id = 123

      const genericModel = new GenericModel(
        GenericClass.DEFAULT_ATTRIBUTES,
        Object
          .assign(createGenericClassMock(), { id: id })
      )

      expect(genericModel.id).to.eql(id)
    })

    context('when the model has a composite primary key', () => {
      let genericModel, idObject

      before(() => {
        let modelAttributes = {
          idAttribute: ['keyOne', 'keyTwo']
        }

        idObject = {}

        for (var i = 0; i < modelAttributes.idAttribute.length; i++)
          idObject[modelAttributes.idAttribute[i]] = 10 * (i + 1)

        modelAttributes = Object
          .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)


        genericModel = new GenericModel(
          modelAttributes,
          Object
            .assign({}, defaultObject, idObject)
        )
      })

      it('should set the id object', () => {
        expect(genericModel.id).to.eql(idObject)
      })
    })

    context('when additional attributes are passed', () => {
      let additionalAttributeName, additionalAttribute, genericModel

      before(() => {
        additionalAttributeName = 'randomAttr'
        additionalAttribute = {
          [additionalAttributeName]: 'Random af'
        }

        genericModel = new GenericModel(
          GenericClass.DEFAULT_ATTRIBUTES,
          Object
            .assign(createGenericClassMock(), additionalAttribute)
        )
      })

      it('should set the additional attribute as virtual', () => {
        expect(genericModel.get(additionalAttributeName)).to.eql(additionalAttribute[additionalAttributeName])
      })

      it('should contain the additional attribute in toJSON method', () => {
        expect(genericModel.toJSON()).to.have.property(additionalAttributeName, additionalAttribute[additionalAttributeName])
      })
    })

    context('when pivot attributes are passed', () => {
      let pivotName, pivot, genericModel

      before(() => {
        pivotName = '_pivot_randomAttr'

        pivot = {
          [pivotName]: 'Random af'
        }

        genericModel = new GenericModel(
          GenericClass.DEFAULT_ATTRIBUTES,
          Object
            .assign(createGenericClassMock(), pivot)
        )
      })

      it('should set the pivot attribute as normal attribute', () => {
        expect(genericModel.get(pivotName)).to.eql(pivot[pivotName])
      })

      it('should not contain the pivot attribute in toJSON method', () => {
        expect(genericModel.toJSON()).to.not.have.property(pivotName)
      })
    })

    context('when relateds are passed', () => {
      let relatedName, relatedObject, relatedJSON, genericModel

      before(() => {
        relatedName = GenericClassRelated.tableName

        relatedObject = {
          [relatedName]: [
            {
              random  : 'attr',
              wtf     : [1, 2, 3],
              lepra   : {
                ka    : 'h'
              }
            },
            {
              random  : 'bla',
              lepra   : {
                an    : 'ta'
              }
            }
          ]
        }

        relatedJSON = GenericClassRelated
          .collection(relatedObject[relatedName])
          .toJSON()

        let modelAttributes = {
          relateds            : GenericClass.DEFAULT_ATTRIBUTES.relateds.concat(relatedName),

          [relatedName]  : function() {
            return this.hasMany('GenericClassRelated')
          }
        }

        modelAttributes = Object
          .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

        genericModel = new GenericModel(
          modelAttributes,
          Object
            .assign(createGenericClassMock(), relatedObject)
        )
      })

      it('should set the related', () => {
        expect(genericModel.related(relatedName).toJSON()).to.deep.equal(relatedJSON)
      })

      it('should contain the related in toJSON result method', () => {
        expect(genericModel.toJSON()).to.have.deep.property(relatedName)
        expect(genericModel.toJSON()[relatedName]).to.deep.equal(relatedJSON)
      })
    })
  })

  describe('fields', () => {

    context('#get', () => {
      it('should return the value of "name" property', () => {
        expect(genericModel.get('name')).to.eql(defaultObject.name)
      })

      it('should return the value of "cpf" property', () => {
        expect(genericModel.get('cpf')).to.eql(defaultObject.cpf)
      })
    })

    context('#set', () => {
      let genericModelTemp

      beforeEach(() => {
        genericModelTemp = new GenericModel(GenericClass.DEFAULT_ATTRIBUTES, defaultObject)
      })

      it('should return the setted value of "name" property', () => {
        const name = 'Another random name'

        genericModelTemp
          .set('name', name)

        expect(genericModelTemp.get('name')).to.eql(name)
      })

      it('should return the setted value of "cpf" property', () => {
        const cpf = 30030030030

        genericModelTemp
          .set('cpf', cpf)

        expect(genericModelTemp.get('cpf')).to.eql(cpf)
      })
    })
  })

  describe('#getIdObject', () => {
    let genericModel, idObject

    before(() => {
      idObject = {
        [GenericClass.DEFAULT_ATTRIBUTES.idAttribute]: 10
      }

      genericModel = new GenericModel(
        GenericClass.DEFAULT_ATTRIBUTES,
        Object
          .assign({}, defaultObject, idObject)
      )
    })

    it('should return the id object { [idName]: idValue }', () => {
      expect(genericModel.getIdObject()).to.eql(idObject)
    })

    context('when the model has a composite primary key', () => {
      let genericModel, idObject

      before(() => {
        let modelAttributes = {
          idAttribute: ['keyOne', 'keyTwo']
        }

        idObject = {}

        for (var i = 0; i < modelAttributes.idAttribute.length; i++)
          idObject[modelAttributes.idAttribute[i]] = 10 * (i + 1)

        modelAttributes = Object
          .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)


        genericModel = new GenericModel(
          modelAttributes,
          Object
            .assign({}, defaultObject, idObject)
        )
      })

      it('should return the id object { [idOneName]: idOneValue, [idTwoNam]: idTwoValue, ... }', () => {
        expect(genericModel.getIdObject()).to.eql(idObject)
      })
    })
  })

  describe('#getAttributes', () => {
    it('should return an array with visible and hidden attrs values', () => {
      const attributes = GenericClass.DEFAULT_ATTRIBUTES.visible
        .concat(GenericClass.DEFAULT_ATTRIBUTES.hidden)

      const attributesTemp = genericModel.getAttributes()

      expect(attributesTemp).to.eql(attributes)
    })
  })

  describe('#getQueryAll', () => {

    let DEFAULT_PARAMS

    before(() => {
      DEFAULT_PARAMS = {
        cpf_start   : '123',
        role_in     : [0, 1],
        name_like   : '%lala%',
        enrollment  : '321'
      }
    })

    function getQueryBuilder(params, model) {
      if (!model)
        model = genericModel

      model.resetQuery()

      const alias = model.tableName
      const queryBuilder = model.query()

      const attributes = model.getAttributes ?
        model.getAttributes() : []

      for (const param in params) {
        const whereObject = QueryBuilderUtils
          .getWhereObject(param, attributes)

        queryBuilder
          .where(`${alias}.${whereObject.attr}`, whereObject.operator, params[param])
      }

      model.resetQuery()

      return queryBuilder
    }

    it('should return the queryBuilder', () => {
      const queryBuilder = genericModel.query()

      const queryBuilderTemp = genericModel
        .getQueryAll()

      expect(queryBuilderTemp.toString()).to.eql(queryBuilder.toString())
    })

    it('should return the queryBuilder filtering the passed attrs', () => {
      const queryBuilder = getQueryBuilder(DEFAULT_PARAMS)

      const queryBuilderTemp = genericModel
        .getQueryAll(DEFAULT_PARAMS)

      expect(queryBuilderTemp.toString()).to.eql(queryBuilder.toString())
    })

    context('when there\'s a param that is not defined in the model', () => {
      const ATTR_NAME = 'attrNotDefinedInTheModel'

      let PARAMS

      before(() => {
        PARAMS = {
          [ATTR_NAME]: 'tosco',
        }

        PARAMS = Object
          .assign({}, PARAMS, DEFAULT_PARAMS)
      })

      it('should return the queryBuilder filtering the passed attrs', () => {
        const queryBuilder = getQueryBuilder(DEFAULT_PARAMS)

        const queryBuilderTemp = genericModel
          .getQueryAll(PARAMS)

        expect(queryBuilderTemp.toString()).to.eql(queryBuilder.toString())
      })

      it('should return the queryBuilder filtering the passed attrs', () => {
        const queryBuilderTemp = genericModel
          .getQueryAll(PARAMS)

        expect(queryBuilderTemp.toString()).to.not.contains(ATTR_NAME)
      })
    })

    context('when the model has no "visible" attrs defined', () => {
      let modelParams, genericModel

      before(() => {
        modelParams = Object
          .assign({}, GenericClass.DEFAULT_ATTRIBUTES)

        delete modelParams.visible

        genericModel = new GenericModel(GenericClass.DEFAULT_ATTRIBUTES, defaultObject)
      })

      it('should return the queryBuilder', () => {
        const queryBuilder = genericModel.query()

        const queryBuilderTemp = genericModel
          .getQueryAll()

        expect(queryBuilderTemp.toString()).to.eql(queryBuilder.toString())
      })

      it('should return the queryBuilder filtering the passed attrs', () => {
        const queryBuilder = getQueryBuilder(DEFAULT_PARAMS)

        const queryBuilderTemp = genericModel
          .getQueryAll(DEFAULT_PARAMS)

        expect(queryBuilderTemp.toString()).to.eql(queryBuilder.toString())
      })
    })

    context('when passing related models params', () => {

      context('and it\'s of type belongsTo', () => {
        let RELATED_MODEL_PARAMS

        let relatedModelName, relatedModel, relatedModelData

        before(() => {
          relatedModelName = genericModel.relateds[0]

          relatedModel = genericModel[relatedModelName]()
          relatedModelData = genericModel[relatedModelName]().relatedData

          RELATED_MODEL_PARAMS = {
            [relatedModelName]: {
              [relatedModelData.targetIdAttribute]: 10
            }
          }
        })

        it('should return the queryBuilder filtering the passed related model attrs', () => {

          const params = Object
            .assign({}, DEFAULT_PARAMS, RELATED_MODEL_PARAMS)

          const relatedIdAttribute = `${relatedModelData.foreignKey || relatedModelData.parentIdAttribute}`

          const queryBuilder = getQueryBuilder(DEFAULT_PARAMS)
          const relatedQueryBuild = getQueryBuilder(RELATED_MODEL_PARAMS[relatedModelName], relatedModel)
            .toString()
            .split('where')[1]

          const queryBuilderTemp = genericModel
            .getQueryAll(params)

          queryBuilder
            .leftJoin(
              relatedModelData.targetTableName,
              `${relatedModelData.targetTableName}.${relatedModelData.targetIdAttribute}`,
              `${genericModel.tableName}.${relatedIdAttribute}`
            )
            .whereRaw(relatedQueryBuild)

          expect(queryBuilderTemp.toString()).to.eql(queryBuilder.toString())
        })
      })

      context('and it\'s of type hasMany', () => {
        let RELATED_MODEL_PARAMS

        let relatedModelName, relatedModelData

        before(() => {
          relatedModelName = 'generic_class_relateds'

          let modelAttributes = {
            relateds            : GenericClass.DEFAULT_ATTRIBUTES.relateds.concat(relatedModelName),

            [relatedModelName]  : function() {
              return this.hasMany('GenericClassRelated')
            }
          }

          modelAttributes = Object
            .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

          genericModel = new GenericModel(modelAttributes, defaultObject)

          relatedModelData = genericModel[relatedModelName]().relatedData

          RELATED_MODEL_PARAMS = {
            [relatedModelName]: {
              [relatedModelData.targetIdAttribute]: 10
            }
          }
        })

        it('should return the queryBuilder filtering the passed related model attrs', () => {
          const params = Object
            .assign({}, DEFAULT_PARAMS, RELATED_MODEL_PARAMS)

          const relatedIdAttribute = `${relatedModelData.foreignKey || relatedModelData.parentIdAttribute}`

          const queryBuilder = getQueryBuilder(DEFAULT_PARAMS)
          const relatedQueryBuild = getQueryBuilder(RELATED_MODEL_PARAMS[relatedModelName], new relatedModelData.target())
            .toString()
            .split('where')[1]

          const queryBuilderTemp = genericModel
            .getQueryAll(params)

          queryBuilder
            .leftJoin(
              relatedModelData.targetTableName,
              `${relatedModelData.targetTableName}.${relatedModelData.key('foreignKey')}`,
              `${genericModel.tableName}.${relatedIdAttribute}`
            )
            .whereRaw(relatedQueryBuild)

          expect(queryBuilderTemp.toString()).to.eql(queryBuilder.toString())
        })

        context('and the key name in the child table is not in the pattern "parentTableName_id"', () => {
          let RELATED_MODEL_PARAMS

          let relatedModelName, relatedParentIdAttribute, relatedModelData

          before(() => {
            relatedModelName = 'generic_class_relateds'
            relatedParentIdAttribute = 'driver_id'

            let modelAttributes = {
              relateds            : GenericClass.DEFAULT_ATTRIBUTES.relateds.concat(relatedModelName),

              [relatedModelName]  : function() {
                return this.hasMany('GenericClassRelated', 'id', relatedParentIdAttribute)
              }
            }

            modelAttributes = Object
              .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

            genericModel = new GenericModel(modelAttributes, defaultObject)

            relatedModelData = genericModel[relatedModelName]().relatedData

            RELATED_MODEL_PARAMS = {
              [relatedModelName]: {
                [relatedParentIdAttribute]: 10
              }
            }
          })

          it('should return the queryBuilder filtering the passed related model attrs', () => {
            const params = Object
              .assign({}, DEFAULT_PARAMS, RELATED_MODEL_PARAMS)

            const relatedIdAttribute = `${relatedModelData.foreignKey || relatedModelData.parentIdAttribute}`

            const queryBuilder = getQueryBuilder(DEFAULT_PARAMS)
            const relatedQueryBuild = getQueryBuilder(RELATED_MODEL_PARAMS[relatedModelName], new relatedModelData.target())
              .toString()
              .split('where')[1]

            const queryBuilderTemp = genericModel
              .getQueryAll(params)

            queryBuilder
              .leftJoin(
                relatedModelData.targetTableName,
                `${relatedModelData.targetTableName}.${relatedParentIdAttribute}`,
                `${genericModel.tableName}.${relatedIdAttribute}`
              )
              .whereRaw(relatedQueryBuild)

            expect(queryBuilderTemp.toString()).to.eql(queryBuilder.toString())
          })
        })
      })

      context('and it\'s of type belongsToMany', () => {
        let RELATED_MODEL_PARAMS

        let relatedModelName, relatedModelData, relatedManyToManyModelName

        before(() => {
          relatedModelName = 'generic_class_relateds'
          relatedManyToManyModelName = 'generic_class_relateds_generic_classes'

          let modelAttributes = {
            relateds            : GenericClass.DEFAULT_ATTRIBUTES.relateds.concat(relatedModelName),

            [relatedModelName]  : function() {
              return this.belongsToMany('GenericClassRelated')
            }
          }

          modelAttributes = Object
            .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

          genericModel = new GenericModel(modelAttributes, defaultObject)

          relatedModelData = genericModel[relatedModelName]().relatedData

          RELATED_MODEL_PARAMS = {
            [relatedModelName]: {
              [relatedModelData.targetIdAttribute]: 10
            }
          }
        })

        it('should return the queryBuilder filtering the passed related model attrs', () => {
          const params = Object
            .assign({}, DEFAULT_PARAMS, RELATED_MODEL_PARAMS)

          const relatedIdAttribute = `${relatedModelData.foreignKey || relatedModelData.parentIdAttribute}`

          const queryBuilder = getQueryBuilder(DEFAULT_PARAMS)
          const relatedQueryBuild = getQueryBuilder(RELATED_MODEL_PARAMS[relatedModelName], new relatedModelData.target())
            .toString()
            .split('where')[1]

          const queryBuilderTemp = genericModel
            .getQueryAll(params)

          queryBuilder
            .leftJoin(
              relatedManyToManyModelName,
              `${relatedManyToManyModelName}.${relatedModelData.key('foreignKey')}`,
              `${genericModel.tableName}.${relatedIdAttribute}`
            )
            .leftJoin(
              relatedModelData.targetTableName,
              `${relatedModelData.targetTableName}.${relatedModelData.targetIdAttribute}`,
              `${relatedManyToManyModelName}.${relatedModelData.key('otherKey')}`
            )
            .whereRaw(relatedQueryBuild)

          expect(queryBuilderTemp.toString()).to.eql(queryBuilder.toString())
        })

        context('and the key name in the mid table is not in the pattern "parentTableName_id"', () => {
          let RELATED_MODEL_PARAMS

          let relatedModelName, relatedParentIdAttribute, relatedModelData

          before(() => {
            relatedModelName = 'generic_class_relateds'
            relatedParentIdAttribute = 'driver_id'

            let modelAttributes = {
              relateds            : GenericClass.DEFAULT_ATTRIBUTES.relateds.concat(relatedModelName),

              [relatedModelName]  : function() {
                return this.belongsToMany('GenericClassRelated', null, 'id', relatedParentIdAttribute)
              }
            }

            modelAttributes = Object
              .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

            genericModel = new GenericModel(modelAttributes, defaultObject)

            relatedModelData = genericModel[relatedModelName]().relatedData

            RELATED_MODEL_PARAMS = {
              [relatedModelName]: {
                [relatedParentIdAttribute]: 10
              }
            }
          })

          it('should return the queryBuilder filtering the passed related model attrs', () => {
            const params = Object
              .assign({}, DEFAULT_PARAMS, RELATED_MODEL_PARAMS)

            const relatedIdAttribute = `${relatedModelData.foreignKey || relatedModelData.parentIdAttribute}`

            const queryBuilder = getQueryBuilder(DEFAULT_PARAMS)
            const relatedQueryBuild = getQueryBuilder(RELATED_MODEL_PARAMS[relatedModelName], new relatedModelData.target())
              .toString()
              .split('where')[1]

            const queryBuilderTemp = genericModel
              .getQueryAll(params)

            queryBuilder
              .leftJoin(
                relatedManyToManyModelName,
                `${relatedManyToManyModelName}.${relatedModelData.key('foreignKey')}`,
                `${genericModel.tableName}.${relatedIdAttribute}`
              )
              .leftJoin(
                relatedModelData.targetTableName,
                `${relatedModelData.targetTableName}.${relatedModelData.targetIdAttribute}`,
                `${relatedManyToManyModelName}.${relatedModelData.key('otherKey')}`
              )
              .whereRaw(relatedQueryBuild)

            expect(queryBuilderTemp.toString()).to.eql(queryBuilder.toString())
          })
        })

        context('and the mid table name is not in the pattern "parentTableName_targetTableName"', () => {
          let RELATED_MODEL_PARAMS

          let tableName, relatedModelName, relatedParentIdAttribute, relatedModelData

          before(() => {
            tableName = 'TableRandomLepra'
            relatedModelName = 'generic_class_relateds'
            relatedParentIdAttribute = 'driver_id'

            let modelAttributes = {
              relateds            : GenericClass.DEFAULT_ATTRIBUTES.relateds.concat(relatedModelName),

              [relatedModelName]  : function() {
                return this.belongsToMany('GenericClassRelated', tableName, 'id', relatedParentIdAttribute)
              }
            }

            modelAttributes = Object
              .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

            genericModel = new GenericModel(modelAttributes, defaultObject)

            relatedModelData = genericModel[relatedModelName]().relatedData

            RELATED_MODEL_PARAMS = {
              [relatedModelName]: {
                [relatedParentIdAttribute]: 10
              }
            }
          })

          it('should return the queryBuilder filtering the passed related model attrs', () => {
            const params = Object
              .assign({}, DEFAULT_PARAMS, RELATED_MODEL_PARAMS)

            const relatedIdAttribute = `${relatedModelData.foreignKey || relatedModelData.parentIdAttribute}`

            const queryBuilder = getQueryBuilder(DEFAULT_PARAMS)
            const relatedQueryBuild = getQueryBuilder(RELATED_MODEL_PARAMS[relatedModelName], new relatedModelData.target())
              .toString()
              .split('where')[1]

            const queryBuilderTemp = genericModel
              .getQueryAll(params)

            queryBuilder
              .leftJoin(
                tableName,
                `${tableName}.${relatedModelData.key('foreignKey')}`,
                `${genericModel.tableName}.${relatedIdAttribute}`
              )
              .leftJoin(
                relatedModelData.targetTableName,
                `${relatedModelData.targetTableName}.${relatedModelData.targetIdAttribute}`,
                `${tableName}.${relatedModelData.key('otherKey')}`
              )
              .whereRaw(relatedQueryBuild)

            expect(queryBuilderTemp.toString()).to.eql(queryBuilder.toString())
          })
        })
      })
    })
  })

  describe('.getAll', () => {
    const DEFAULT_FETCH_PARAMS = { withRelated: GenericClass.relateds }

    context('when filtered by organization', () => {
      let DEFAULT_PARAMS

      before(function*() {
        DEFAULT_PARAMS = {
          organization_id: genericClass.get('organization_id'),
        }

        yield GenericClassMock.addList({
          role : 0,
          organization_id: organization.id
        }, 3)

        yield GenericClassMock.addList({
          role : 1,
          organization_id: organization.id
        }, 3)
      })

      it('should return the list of objects', function*() {
        const params = Object
          .assign({}, DEFAULT_PARAMS)

        const objectsTemp = yield GenericClass
          .getAll({ ...params, orderBy: 'name' })

        const objects = yield GenericClass
          .where(params)
          .orderBy('name')
          .fetchAll(DEFAULT_FETCH_PARAMS)

        expect(objectsTemp.toJSON()).to.deep.equal(objects.toJSON())
      })

      context('and pageSize is 2', () => {
        it('should return 2 objects', function*() {
          const params = Object
            .assign({}, DEFAULT_PARAMS, { orderBy: 'name', pageSize  : 2 })

          const queryParams = Object
            .assign({}, DEFAULT_PARAMS)

          const objectsTemp = yield GenericClass
            .getAll(params)

          const objects = yield GenericClass
            .where(queryParams)
            .orderBy('name')
            .fetchAll(DEFAULT_FETCH_PARAMS)

          expect(objectsTemp).to.have.lengthOf(2)
          expect(objectsTemp.toJSON()).to.deep.equal(objects.toJSON().slice(0, 2))
        })
      })

      context('and page is 2', () => {
        it('should return the objects of page 2', function*() {
          const params = Object
            .assign({}, DEFAULT_PARAMS, { page  : 2 })

          const objectsTemp = yield GenericClass
            .getAll(params)

          expect(objectsTemp).to.have.lengthOf(0)
        })
      })

      context('and role', () => {
        it('should return the list of objects', function*() {
          const params = Object
            .assign({}, DEFAULT_PARAMS, { role: genericClass.get('role') })

          const objectsTemp = yield GenericClass
            .getAll({ ...params, orderBy: 'name'})

          const objects = yield GenericClass
            .where(params)
            .orderBy('name')
            .fetchAll(DEFAULT_FETCH_PARAMS)

          expect(objectsTemp.toJSON()).to.deep.equal(objects.toJSON())
        })
      })

      context('and genericSearch', () => {
        context('by name', () => {
          const ATTR = 'name'

          it('should return the list of objects', function*() {
            const genericSearch = genericClass
              .get(ATTR)
              .substring(0, 3)

            const params = Object
              .assign({}, DEFAULT_PARAMS, { genericSearch: genericSearch })

            const queryParams = Object
              .assign({}, DEFAULT_PARAMS)

            const objectsTemp = yield GenericClass
              .getAll(params)

            const objects = yield GenericClass
              .query(
                q => {
                  q
                    .where(queryParams)
                    .where(ATTR, 'like', `${genericSearch}%`)
                    .orderBy('name')
                }
              )
              .fetchAll(DEFAULT_FETCH_PARAMS)

            expect(objectsTemp.length).to.have.at.least(objects.length)
          })
        })

        context('by cpf', () => {
          const ATTR = 'cpf'

          it('should return the employees', function*() {
            const genericSearch = genericClass
              .get(ATTR)
              .substring(0, 3)

            const params = Object
              .assign({}, DEFAULT_PARAMS, { genericSearch: genericSearch })

            const queryParams = Object
              .assign({}, DEFAULT_PARAMS)

            const objectsTemp = yield GenericClass
              .getAll(params)

            const objects = yield GenericClass
              .query(
                q => {
                  q
                    .where(queryParams)
                    .where(ATTR, 'like', `${genericSearch}%`)
                    .orderBy('name')
                }
              )
              .fetchAll(DEFAULT_FETCH_PARAMS)

            expect(objectsTemp.length).to.have.at.least(objects.length)
          })
        })

        context('by enrollment', () => {
          const ATTR = 'enrollment'

          it('should return the list of objects', function*() {
            const genericSearch = genericClass
              .get(ATTR)
              .substring(0, 3)

            const params = Object
              .assign({}, DEFAULT_PARAMS, { genericSearch: genericSearch })

            const queryParams = Object
              .assign({}, DEFAULT_PARAMS)

            const objectsTemp = yield GenericClass
              .getAll(params)

            const objects = yield GenericClass
              .query(
                q => {
                  q
                    .where(queryParams)
                    .where(ATTR, 'like', `${genericSearch}%`)
                    .orderBy('name')
                }
              )
              .fetchAll(DEFAULT_FETCH_PARAMS)

            expect(objectsTemp.length).to.have.at.least(objects.length)
          })
        })
      })
    })
  })

  describe('.getCount', () => {
    context('when filtered by organization', () => {
      let DEFAULT_PARAMS

      before(function*() {
        DEFAULT_PARAMS = {
          organization_id: genericClass.get('organization_id')
        }

        yield GenericClassMock.addList({
          role : 0,
          organization_id: organization.id
        }, 3)

        yield GenericClassMock.addList({
          role : 1,
          organization_id: organization.id
        }, 3)
      })

      it('should return the list of objects', function*() {
        const params = Object
          .assign({}, DEFAULT_PARAMS)

        const countObjectsTemp = yield GenericClass
          .getCount(params)

        const countObjects = yield GenericClass
          .where(params)
          .count()

        expect(countObjectsTemp).to.be.equal(parseInt(countObjects))
      })

      context('and role', () => {
        it('should return the total of objects', function*() {
          const params = Object
            .assign({}, DEFAULT_PARAMS, { role: genericClass.get('role') })

          const countObjectsTemp = yield GenericClass
            .getCount(params)

          const countObjects = yield GenericClass
            .where(params)
            .count()

          expect(countObjectsTemp).to.be.equal(parseInt(countObjects))
        })
      })
    })
  })

  describe('.getOne', () => {
    context('when filtered by organization', () => {
      let DEFAULT_PARAMS

      before(function*() {
        DEFAULT_PARAMS = {
          organization_id: genericClass.get('organization_id')
        }

        yield GenericClassMock.addList({
          role : 0,
          organization_id: organization.id
        }, 3)

        yield GenericClassMock.addList({
          role : 1,
          organization_id: organization.id
        }, 3)
      })

      it('should return the object', function*() {
        const params = Object
          .assign({}, DEFAULT_PARAMS)

        const objectOneTemp = yield GenericClass
          .getOne({ ...params, orderBy: { name: 'ASC' }})

        const objectOne = yield GenericClass
          .where(params)
          .orderBy('name')
          .fetch({
            withRelated: GenericClass.relateds
          })

        expect(objectOneTemp.toJSON().id).to.be.equal(objectOne.toJSON().id)
      })

      context('and role', () => {
        it('should return the object', function*() {
          const params = Object
            .assign({}, DEFAULT_PARAMS, { role: genericClass.get('role') })

          const objectOneTemp = yield GenericClass
            .getOne({ ...params, orderBy: { name: 'ASC' }})

          const objectOne = yield GenericClass
            .where(params)
            .orderBy('name')
            .fetch({
              withRelated: GenericClass.relateds
            })

          expect(objectOneTemp.toJSON().id).to.be.equal(objectOne.toJSON().id)
        })
      })
    })
  })

  describe('.isPersisted', () => {
    let genericModelPersisted, genericModelNotPersisted

    before(function*() {
      genericModelPersisted = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES, createGenericClassMock())
        .save()

      genericModelNotPersisted = new GenericModel(
        GenericClass.DEFAULT_ATTRIBUTES,
        Object
          .assign(createGenericClassMock(), { id: Math.round(Math.random() * 999999) })
      )
    })

    context('when persisted', () => {
      it('should return true', async () => {
        const isPersisted = await GenericClass
          .isPersisted(genericModelPersisted.id)

        expect(isPersisted).to.be.true
      })
    })

    context('when not persisted', () => {
      it('should return false', async () => {
        const isPersisted = await GenericClass
          .isPersisted(genericModelNotPersisted.id)

        expect(isPersisted).to.be.false
      })
    })

    context('when composite primary key', () => {
      context('when persisted', () => {
        let genericModelCompositePK

        before(function*() {
          const genericModelSaved = yield GenericClassMock.add({ organization_id: organization.id })

          let modelAttributes = {
            idAttribute: ['enrollment', 'cpf']
          }

          const modelObject = createGenericClassMock()

          modelAttributes = Object
            .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

          modelAttributes.idAttribute
            .forEach(
              attr =>
                modelObject[attr] = genericModelSaved.get(attr)
            )

          genericModelCompositePK = new GenericModel(modelAttributes, modelObject)
        })

        it('should return true', async () => {
          const isPersisted = await GenericClass
            .isPersisted(genericModelCompositePK.id)

          expect(isPersisted).to.be.true
        })
      })

      context('when first key is not persisted', () => {
        let genericModelCompositePK

        before(function*() {
          const genericModelSaved = yield GenericClassMock.add({ organization_id: organization.id })

          let modelAttributes = {
            idAttribute: ['enrollment', 'cpf']
          }

          const modelObject = createGenericClassMock()

          const firstKeyAttribute = modelAttributes.idAttribute[0]

          modelAttributes = Object
            .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

          modelAttributes.idAttribute
            .forEach(
              attr =>
                modelObject[attr] = attr == firstKeyAttribute ?
                  null :
                  genericModelSaved.get(attr)
            )

          genericModelCompositePK = new GenericModel(modelAttributes, modelObject)
        })

        it('should return false', async () => {
          const isPersisted = await GenericClass
            .isPersisted(genericModelCompositePK.id)

          expect(isPersisted).to.be.false
        })
      })

      context('when second key is not persisted', () => {
        let genericModelCompositePK

        before(function*() {
          const genericModelSaved = yield GenericClassMock.add({ organization_id: organization.id })

          let modelAttributes = {
            idAttribute: ['enrollment', 'cpf']
          }

          const modelObject = createGenericClassMock()

          const secondKeyAttribute = modelAttributes.idAttribute[1]

          modelAttributes = Object
            .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

          modelAttributes.idAttribute
            .forEach(
              attr =>
                modelObject[attr] = attr == secondKeyAttribute ?
                  null :
                  genericModelSaved.get(attr)
            )

          genericModelCompositePK = new GenericModel(modelAttributes, modelObject)
        })

        it('should return false', async () => {
          const isPersisted = await GenericClass
            .isPersisted(genericModelCompositePK.id)

          expect(isPersisted).to.be.false
        })
      })
    })
  })

  describe('#where', () => {

    context('#count', () => {
      it('should return the count of genericModel\'s table', function*() {
        const count = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
          .count('id', { 'organization_id': organization.id })

        expect(count).to.be.at.least(1)
      })
    })

    context('#fetch', () => {

      it('should return one item of genericModel\'s table', function*() {
        const genericModelItem = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
          .where({'organization_id': organization.id, 'id': genericClass.id})
          .fetch()

        expect(genericModelItem.toJSON()).to.shallowDeepEqual(genericClass.toJSON())
      })

      context('#related', () => {
        it('should return one item of genericModel\'s table', function*() {
          const genericModelItem = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
            .where({'organization_id': organization.id})
            .fetch({withRelated: ['generic_related_persisted']})

          const relatedModel = genericModelItem.related('generic_related_persisted')

          expect(relatedModel.toJSON()).to.shallowDeepEqual(organization.toJSON())
        })
      })
    })
  })

  describe('#findById', () => {

    it('should return the genericModel', function*() {
      const genericModelItem = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
        .findById(genericClass.id)

      expect(genericModelItem.toJSON()).to.shallowDeepEqual(genericClass.toJSON())
    })

    context('when there\'s related models', () => {

      it('should return the passed relateds of genericModel', function*() {
        const genericModelItem = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
          .findById(genericClass.id, { withRelated: ['generic_related_persisted'] })

        const relatedModel = genericModelItem.related('generic_related_persisted')

        expect(relatedModel.toJSON()).to.shallowDeepEqual(organization.toJSON())
      })
    })

    context('when there\'s no model with the passed id', () => {

      it('should return null', function*() {
        const genericModelItem = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
          .findById('46848464')

        expect(genericModelItem).to.not.exist
      })
    })
  })

  describe('#save', () => {
    let genericModelTemp

    beforeEach(() => {
      genericModelTemp = new GenericModel(GenericClass.DEFAULT_ATTRIBUTES, createGenericClassMock(organization.id))
    })

    it('should save the genericModel', function*() {
      yield genericModelTemp
        .save()

      expect(genericModelTemp.id).to.exist
    })
  })

  describe('#update', () => {
    let genericModelTemp

    before(function*() {
      genericModelTemp = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES, createGenericClassMock(organization.id))
        .save()
    })

    it('should update the genericModel', function*() {
      const name = 'New name random'

      genericModelTemp
        .set('name', name)

      yield genericModelTemp
        .save()

      expect(genericModelTemp.get('name')).to.eql(name)
    })
  })

  describe('#destroy', () => {
    let genericModelTemp

    before(function*() {
      genericModelTemp = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES, createGenericClassMock(organization.id))
        .save()
    })

    it('should destroy the genericModel', function*() {
      yield genericModelTemp
        .destroy()

      const genericModelTempDeleted = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
        .where('id', genericModelTemp.id)
        .fetch()

      expect(genericModelTempDeleted).to.not.exist
    })
  })

  describe('#delete', () => {

    context('when the model has soft delete', () => {
      let genericModel

      before(function*() {
        genericModel = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES, createGenericClassMock(organization.id))
          .save()

        yield genericModel
          .delete()
      })

      it('should not remove the genericModel from the database', function*() {
        const genericModelDeleted = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
          .where('id', genericModel.id)
          .fetch({
            softDelete: false
          })

        expect(genericModelDeleted).to.exist
      })

      it('should set "deleted_at" to the genericModel', function*() {
        const genericModelDeleted = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
          .where('id', genericModel.id)
          .fetch({
            softDelete: false
          })

        expect(genericModelDeleted.get('deleted_at')).to.exist
      })
    })

    context('when the model has no soft delete', () => {
      let genericModel

      before(function*() {
        let modelAttributes = {
          soft: false
        }

        modelAttributes = Object
          .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

        genericModel = yield new GenericModel(modelAttributes, createGenericClassMock(organization.id))
          .save()

        yield genericModel
          .delete()
      })

      it('should remove the genericModel from the database', function*() {
        const genericModelDeleted = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
          .where('id', genericModel.id)
          .fetch({
            softDelete: false
          })

        expect(genericModelDeleted).to.not.exist
      })
    })

    context('when the model has a composite primary key', () => {

      context('and has soft delete', () => {
        let genericModel, idObject

        before(function*() {
          const genericModelSaved = yield GenericClassMock.add({ organization_id: organization.id })

          let modelAttributes = {
            idAttribute: ['enrollment', 'cpf']
          }

          idObject = {}

          for (var i = 0; i < modelAttributes.idAttribute.length; i++)
            idObject[modelAttributes.idAttribute[i]] = genericModelSaved.get(modelAttributes.idAttribute[i])

          modelAttributes = Object
            .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

          genericModel = new GenericModel(
            modelAttributes,
            Object
              .assign({}, genericModelSaved.toJSON(), idObject)
          )

          yield genericModel
            .delete()
        })

        it('should not remove the genericModel from the database', function*() {
          const genericModelDeleted = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
            .where(genericModel.id)
            .fetch({
              softDelete: false
            })

          expect(genericModelDeleted).to.exist
        })

        it('should set "deleted_at" to the genericModel', function*() {
          const genericModelDeleted = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
            .where(genericModel.id)
            .fetch({
              softDelete: false
            })

          expect(genericModelDeleted.get('deleted_at')).to.exist
        })
      })

      context('and has no soft delete', () => {
        let genericModel, idObject

        before(function*() {
          const genericModelSaved = yield GenericClassMock.add({ organization_id: organization.id })

          let modelAttributes = {
            idAttribute   : ['enrollment', 'cpf'],
            soft          : false
          }

          idObject = {}

          for (var i = 0; i < modelAttributes.idAttribute.length; i++)
            idObject[modelAttributes.idAttribute[i]] = genericModelSaved.get(modelAttributes.idAttribute[i])

          modelAttributes = Object
            .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

          genericModel = new GenericModel(
            modelAttributes,
            Object
              .assign({}, genericModelSaved.toJSON(), idObject)
          )

          yield genericModel
            .delete()
        })

        it('should delete the genericModel', function*() {
          const genericModelDeleted = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
            .where(genericModel.id)
            .fetch()

          expect(genericModelDeleted).to.not.exist
        })

        it('should remove the genericModel from the database', function*() {
          const genericModelDeleted = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES)
            .where(genericModel.id)
            .fetch({
              softDelete: false
            })

          expect(genericModelDeleted).to.not.exist
        })
      })
    })
  })

  describe('#isPersisted', () => {
    let genericModelPersisted, genericModelNotPersisted

    before(function*() {
      genericModelPersisted = yield new GenericModel(GenericClass.DEFAULT_ATTRIBUTES, createGenericClassMock())
        .save()

      genericModelNotPersisted = new GenericModel(
        GenericClass.DEFAULT_ATTRIBUTES,
        Object
          .assign(createGenericClassMock(), { id: Math.round(Math.random() * 999999) })
      )
    })

    context('when persisted', () => {
      it('should return true', function*() {
        const isPersisted = yield genericModelPersisted
          .isPersisted()

        expect(isPersisted).to.be.true
      })
    })

    context('when not persisted', () => {
      it('should return false', function*() {
        const isPersisted = yield genericModelNotPersisted
          .isPersisted()

        expect(isPersisted).to.be.false
      })
    })

    context('when composite primary key', () => {
      context('when persisted', () => {
        let genericModelCompositePK

        before(function*() {
          const genericModelSaved = yield GenericClassMock.add({ organization_id: organization.id })

          let modelAttributes = {
            idAttribute: ['enrollment', 'cpf']
          }

          const modelObject = createGenericClassMock()

          modelAttributes = Object
            .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

          modelAttributes.idAttribute
            .forEach(
              attr =>
                modelObject[attr] = genericModelSaved.get(attr)
            )

          genericModelCompositePK = new GenericModel(modelAttributes, modelObject)
        })

        it('should return true', function*() {
          const isPersisted = yield genericModelCompositePK
            .isPersisted()

          expect(isPersisted).to.be.true
        })
      })

      context('when first key is not persisted', () => {
        let genericModelCompositePK

        before(function*() {
          const genericModelSaved = yield GenericClassMock.add({ organization_id: organization.id })

          let modelAttributes = {
            idAttribute: ['enrollment', 'cpf']
          }

          const modelObject = createGenericClassMock()

          const firstKeyAttribute = modelAttributes.idAttribute[0]

          modelAttributes = Object
            .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

          modelAttributes.idAttribute
            .forEach(
              attr =>
                modelObject[attr] = attr == firstKeyAttribute ?
                  null :
                  genericModelSaved.get(attr)
            )

          genericModelCompositePK = new GenericModel(modelAttributes, modelObject)
        })

        it('should return false', function*() {
          const isPersisted = yield genericModelCompositePK
            .isPersisted()

          expect(isPersisted).to.be.false
        })
      })

      context('when second key is not persisted', () => {
        let genericModelCompositePK

        before(function*() {
          const genericModelSaved = yield GenericClassMock.add({ organization_id: organization.id })

          let modelAttributes = {
            idAttribute: ['enrollment', 'cpf']
          }

          const modelObject = createGenericClassMock()

          const secondKeyAttribute = modelAttributes.idAttribute[1]

          modelAttributes = Object
            .assign({}, GenericClass.DEFAULT_ATTRIBUTES, modelAttributes)

          modelAttributes.idAttribute
            .forEach(
              attr =>
                modelObject[attr] = attr == secondKeyAttribute ?
                  null :
                  genericModelSaved.get(attr)
            )

          genericModelCompositePK = new GenericModel(modelAttributes, modelObject)
        })

        it('should return false', function*() {
          const isPersisted = yield genericModelCompositePK
            .isPersisted()

          expect(isPersisted).to.be.false
        })
      })
    })
  })

  describe('#isDeleted', () => {
    let genericModel

    beforeEach(() => {
      genericModel = new GenericModel(GenericClass.DEFAULT_ATTRIBUTES, createGenericClassMock())
    })

    context('when attr "deleted_at" is null', () => {
      it('should return false', () => {
        const isDeleted = genericModel
          .isDeleted()

        expect(isDeleted).to.be.false
      })
    })

    context('when attr "deleted_at" is not null', () => {
      beforeEach(() => {
        genericModel
          .set('deleted_at', new Date(2017, 10, 10))
      })

      context('when attr "restored_at" is null', () => {
        it('should return true', () => {
          const isDeleted = genericModel
            .isDeleted()

          expect(isDeleted).to.be.true
        })
      })

      context('when attr "restored_at" > "deleted_at"', () => {
        beforeEach(() => {
          const date = new Date(genericModel.get('deleted_at'))

          date
            .setDate(date.getDate() + 1)

          genericModel
            .set('restored_at', date)
        })

        it('should return false', () => {
          const isDeleted = genericModel
            .isDeleted()

          expect(isDeleted).to.be.false
        })
      })

      context('when attr "restored_at" < "deleted_at"', () => {
        beforeEach(() => {
          const date = new Date(genericModel.get('deleted_at'))

          date
            .setDate(date.getDate() - 2)

          genericModel
            .set('restored_at', date)
        })

        it('should return true', () => {
          const isDeleted = genericModel
            .isDeleted()

          expect(isDeleted).to.be.true
        })
      })
    })
  })

  describe('#areConstraintsValids', () => {
    let genericModelValid, genericModelInvalid, genericModelNotPersisted

    before(function*() {
      genericModelValid = yield new GenericModel(
        GenericClass.DEFAULT_ATTRIBUTES,
        Object
          .assign({}, createGenericClassMock())
      )
        .save()

      genericModelInvalid = new GenericModel(
        GenericClass.DEFAULT_ATTRIBUTES,
        Object
          .assign(genericModelValid.toJSON(), { id: Math.round(Math.random() * 999) })
      )

      genericModelNotPersisted = new GenericModel(
        GenericClass.DEFAULT_ATTRIBUTES,
        Object
          .assign(genericModelValid.toJSON(), { cpf: '123' })
      )
    })

    context('when constraints already in use', () => {
      context('and it is his owner', () => {
        it('should return true', function*() {
          const areConstraintsValids = yield genericModelValid
            .areConstraintsValids()

          expect(areConstraintsValids).to.be.true
        })
      })

      context('and it is another genericModel', () => {
        it('should return false', function*() {
          const areConstraintsValids = yield genericModelInvalid
            .areConstraintsValids()

          expect(areConstraintsValids).to.be.false
        })
      })
    })

    context('when constraints not in use', () => {

      context('and genericModel has no id', () => {
        it('should return false', function*() {
          const areConstraintsValids = yield genericModelNotPersisted
            .areConstraintsValids()

          expect(areConstraintsValids).to.be.true
        })
      })
    })
  })

  describe('#validation', () => {
    let genericModelNameNull, genericModelOrganizationIdNull

    before(() => {
      genericModelNameNull = new GenericModel(
        GenericClass.DEFAULT_ATTRIBUTES,
        Object
          .assign({}, defaultObject, {name: null})
      )

      genericModelOrganizationIdNull = new GenericModel(
        GenericClass.DEFAULT_ATTRIBUTES,
        Object
          .assign({}, defaultObject, {organization_id: null})
      )
    })

    context('when valid', () => {
      it('should return null', function*() {
        const validation = genericModel
          .validation()

        expect(validation).to.not.exist
      })
    })

    context('when name is null', () => {
      it('should return a validation message error', function*() {
        const validation = genericModelNameNull
          .validation()

        expect(validation).to.have.property('name')
      })
    })

    context('when organization_id is null', () => {
      it('should return a validation message error', function*() {
        const validation = genericModelOrganizationIdNull
          .validation()

        expect(validation).to.have.property('organization_id')
      })
    })
  })

  describe('#isObjectValid', () => {
    let genericModelNameNull, genericModelOrganizationIdNull

    before(() => {
      genericModelNameNull = new GenericModel(
        GenericClass.DEFAULT_ATTRIBUTES,
        Object
          .assign({}, defaultObject, {name: null})
      )

      genericModelOrganizationIdNull = new GenericModel(
        GenericClass.DEFAULT_ATTRIBUTES,
        Object
          .assign({}, defaultObject, {organization_id: null})
      )
    })

    context('when valid', () => {
      it('should return null', function*() {
        const isObjectValid = genericModel
          .isObjectValid()

        expect(isObjectValid).to.be.true
      })
    })

    context('when name is null', () => {
      it('should return false', function*() {
        const isObjectValid = genericModelNameNull
          .isObjectValid()

        expect(isObjectValid).to.be.false
      })
    })

    context('when organization_id is null', () => {
      it('should return false', function*() {
        const isObjectValid = genericModelOrganizationIdNull
          .isObjectValid()

        expect(isObjectValid).to.be.false
      })
    })
  })

  describe('#toJSON', () => {

    it('should return the json object', function*() {
      const genericModelJSON = genericModel
        .toJSON()

      expect(genericModelJSON).to.exist
    })

    context('when there\'s virtual properties', () => {

      it('should contain the virtual property', function*() {
        const genericModelJSON = genericModel
          .toJSON()

        expect(genericModelJSON).to.have.property('virtualProperty')
      })

      context('when virtuals:false is passed', () => {

        it('should not contain any virtual property', function*() {
          const genericModelJSON = genericModel
            .toJSON({ virtuals: false, shallow: true })

          expect(genericModelJSON).to.not.have.property('virtualProperty')
        })
      })
    })

    context('when there\'s pivot properties', () => {
      let pivotName, pivot, genericModel

      before(() => {
        pivotName = '_pivot_randomAttr'

        pivot = {
          [pivotName]: 'Random af'
        }

        genericModel = new GenericModel(
          GenericClass.DEFAULT_ATTRIBUTES,
          Object
            .assign(createGenericClassMock(), pivot)
        )
      })

      it('should contain the pivot property', function*() {
        const genericModelJSON = genericModel
          .toJSON()

        expect(genericModelJSON).to.have.property(pivotName.replace('_pivot_', ''), pivot[pivotName])
      })

      context('when omitPivot:true is passed', () => {

        it('should not contain any pivot property', function*() {
          const genericModelJSON = genericModel
            .toJSON({ omitPivot: true, shallow: true })

          expect(genericModelJSON).to.not.have.property(pivotName)
        })
      })
    })
  })
})