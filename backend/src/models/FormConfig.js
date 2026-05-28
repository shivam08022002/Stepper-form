import mongoose from 'mongoose';

const { Schema } = mongoose;

const fieldSchema = new Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'select', 'radio'],
    required: true
  },
  required: { type: Boolean, default: false },
  options: [{ type: String }],
  validation: {
    minLength: { type: Number },
    maxLength: { type: Number },
    pattern: { type: String }
  }
});

const stepSchema = new Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  order: { type: Number, required: true },
  fields: [fieldSchema]
});

const formConfigSchema = new Schema({
  title: { type: String, required: true },
  steps: [stepSchema]
}, { timestamps: true });

const FormConfig = mongoose.model('FormConfig', formConfigSchema);
export default FormConfig;
