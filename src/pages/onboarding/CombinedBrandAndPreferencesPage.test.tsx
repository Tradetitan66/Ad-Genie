import OnboardingLayout from '../../components/OnboardingLayout';

export default function CombinedBrandAndPreferencesPageTest() {
  return (
    <OnboardingLayout currentStep={3} totalSteps={3} stepLabel="TEST PAGE">
      <div className="bg-green-100 p-8 rounded-lg">
        <h1 className="text-2xl font-bold text-green-800 mb-4">✅ Simple Test Component Works!</h1>
        <p className="text-gray-700 mb-4">If you see this, the route is working.</p>
        <p className="text-sm text-gray-600">This is a minimal test component to verify routing works.</p>
      </div>
    </OnboardingLayout>
  );
}

