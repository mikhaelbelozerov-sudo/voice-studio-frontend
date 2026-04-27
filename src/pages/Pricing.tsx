const plans = [
  { name: "Free", value: "1 мин/день" },
  { name: "Pro", value: "$10/мес" },
  { name: "Premium", value: "$25/мес" }
];

export const PricingPage = () => {
  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-slate-900">Pricing</h1>
      {plans.map((plan) => (
        <div key={plan.name} className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">{plan.name}</p>
          <p className="text-slate-600">{plan.value}</p>
        </div>
      ))}
    </div>
  );
};
