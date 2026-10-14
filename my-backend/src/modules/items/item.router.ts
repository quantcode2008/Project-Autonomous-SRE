import { Router } from 'express'
import { itemController } from './item.controller'
import {
  createItemSchema,
  updateItemSchema,
  itemIdParamSchema,
  listItemsQuerySchema,
} from './item.schema'
import { validate } from '../../middleware/validate'
import { requireAuth } from '../../auth/middleware'

export const itemRouter = Router()

// All item operations require verified session authentication
itemRouter.use(requireAuth)

itemRouter.post(
  '/',
  validate({ body: createItemSchema }),
  itemController.create
)

itemRouter.get(
  '/',
  validate({ query: listItemsQuerySchema }),
  itemController.list
)

itemRouter.get(
  '/:id',
  validate({ params: itemIdParamSchema }),
  itemController.getById
)

itemRouter.patch(
  '/:id',
  validate({ params: itemIdParamSchema, body: updateItemSchema }),
  itemController.update
)

itemRouter.delete(
  '/:id',
  validate({ params: itemIdParamSchema }),
  itemController.delete
)
