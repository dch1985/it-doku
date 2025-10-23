import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';

const router = Router();
const controller = new DocumentController();

router.post('/', controller.create);
router.get('/', controller.getAll);
router.get('/category/:category', controller.getByCategory);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;