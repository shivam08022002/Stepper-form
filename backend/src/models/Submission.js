import mongoose from 'mongoose';

const { Schema } = mongoose;

const submissionSchema = new Schema({
  userId: { type: String, default: 'user_001', required: true },
  configId: { type: Schema.Types.ObjectId, ref: 'FormConfig', required: true },
  status: { type: String, enum: ['draft', 'completed'], default: 'draft', required: true },
  currentStep: { type: Number, default: 0, required: true },
  completedSteps: [{ type: String }]
}, { timestamps: true });

submissionSchema.index({ userId: 1, status: 1 });
submissionSchema.index({ userId: 1, createdAt: -1 });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
