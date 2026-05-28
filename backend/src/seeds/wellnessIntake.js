import FormConfig from '../models/FormConfig.js';

export const seedWellnessIntake = async () => {
  try {
    const existing = await FormConfig.findOne({ title: 'Wellness Intake' });
    if (existing) {
      console.log('Wellness Intake config already exists. Skipping seed.');
      return;
    }

    const wellnessIntakeData = {
      title: 'Wellness Intake',
      steps: [
        {
          id: 'personal_details',
          label: 'Personal Details',
          order: 0,
          fields: [
            {
              id: 'full_name',
              label: 'Full Name',
              type: 'text',
              required: true,
              validation: { minLength: 2 }
            },
            {
              id: 'age',
              label: 'Age',
              type: 'text',
              required: true
            },
            {
              id: 'gender',
              label: 'Gender',
              type: 'select',
              required: true,
              options: ['Male', 'Female', 'Non-binary', 'Prefer not to say']
            }
          ]
        },
        {
          id: 'wellness_preferences',
          label: 'Wellness Preferences',
          order: 1,
          fields: [
            {
              id: 'primary_goals',
              label: 'Primary Goals',
              type: 'select',
              required: false,
              options: ['Sleep better', 'Improve focus', 'Reduce stress', 'Lose weight']
            },
            {
              id: 'support_type',
              label: 'Support Type',
              type: 'radio',
              required: true,
              options: ['Self-Guided', 'Coach Support', 'Not Sure']
            },
            {
              id: 'notes',
              label: 'Notes',
              type: 'text',
              required: false,
              validation: { maxLength: 500 }
            }
          ]
        },
        {
          id: 'availability',
          label: 'Availability',
          order: 2,
          fields: [
            {
              id: 'preferred_time',
              label: 'Preferred Time',
              type: 'select',
              required: false,
              options: ['Morning', 'Afternoon', 'Evening']
            },
            {
              id: 'contact_method',
              label: 'Contact Method',
              type: 'radio',
              required: true,
              options: ['Email', 'Phone', 'SMS']
            },
            {
              id: 'additional_details',
              label: 'Additional Details',
              type: 'text',
              required: false,
              validation: { maxLength: 300 }
            }
          ]
        }
      ]
    };

    const newConfig = new FormConfig(wellnessIntakeData);
    await newConfig.save();
    console.log('Seeded "Wellness Intake" form config successfully.');
  } catch (error) {
    console.error('Error seeding Wellness Intake form config:', error);
  }
};
