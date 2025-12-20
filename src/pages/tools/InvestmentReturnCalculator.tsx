import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/SEO';
import { TrendingUp, DollarSign, Calendar, Percent, RefreshCw } from 'lucide-react';

interface CalculationResult {
  totalAmount: number;
  totalPrincipal: number;
  totalInterest: number;
  yearlyData: Array<{
    year: number;
    amount: number;
    principal: number;
    interest: number;
  }>;
}

const InvestmentReturnCalculator = () => {
  const { t } = useTranslation();
  
  const [initialAmount, setInitialAmount] = useState<string>('10000');
  const [rate, setRate] = useState<string>('5');
  const [years, setYears] = useState<string>('10');
  const [monthlyContribution, setMonthlyContribution] = useState<string>('0');
  const [compoundFreq, setCompoundFreq] = useState<'monthly' | 'yearly'>('yearly');

  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculate = () => {
    const principal = parseFloat(initialAmount) || 0;
    const r = parseFloat(rate) || 0;
    const time = parseFloat(years) || 0;
    const contribution = parseFloat(monthlyContribution) || 0;

    if (time <= 0) return;

    let currentAmount = principal;
    let totalPrincipal = principal;
    const yearlyData = [];

    const monthlyRate = r / 100 / 12;
    const yearlyRate = r / 100;

    for (let i = 1; i <= time; i++) {
      let yearStartAmount = currentAmount;
      
      if (compoundFreq === 'monthly') {
        // Monthly compounding with monthly contributions
        for (let m = 0; m < 12; m++) {
          currentAmount = (currentAmount + contribution) * (1 + monthlyRate);
          totalPrincipal += contribution;
        }
      } else {
        // Yearly compounding
        // Assuming contributions are added at the end of each month but compounded yearly is a bit complex approximation usually.
        // Standard simple approach: Contributions earn interest for the part of the year they are in? 
        // Or simplified: Lump sum contribution at end of year?
        // Let's stick to standard practice: 
        // If yearly compounding, usually we assume contributions are added but interest calculates on balance.
        // For simplicity in this tool:
        // Monthly contributions * 12 added to principal.
        // Interest calculated on (YearStart + TotalContribution/2) approx or just YearStart?
        // Let's use a precise monthly iteration for accumulation but only credit interest at end of year?
        // To be accurate and standard: "Yearly Compounding" usually means effective rate is annual.
        // Let's stick to: Monthly contribution -> Compounded Monthly is best for most people.
        // If they select Yearly, we treat it as: Interest applied once a year.
        
        let yearlyContribution = contribution * 12;
        // Simple approximation for yearly compounding with monthly deposits:
        // Interest = (StartBalance + YearlyContribution/2) * rate? No.
        // Let's iterate months for contribution addition, but apply interest at end.
        
        let interest = 0;
        let balanceForInterest = currentAmount;
        for(let m=0; m<12; m++) {
             // Add contribution
             currentAmount += contribution;
             totalPrincipal += contribution;
        }
        // Apply interest on the start balance
        interest = balanceForInterest * yearlyRate; 
        // Plus interest on contributions? 
        // Standard "Yearly Compounding" with monthly deposits is tricky. 
        // Let's simplify: If Yearly Compounding, we assume contributions happen at end of year or start?
        // Let's switch logic: The most common useful calculator is Monthly Compounding.
        // Let's keep it simple. If 'Yearly', we compound once at end of year on the whole balance.
        
        currentAmount += interest;
        
        // Correcting the logic for "Yearly Compounding with Monthly Deposits":
        // It's technically: Future Value of a Series. 
        // But let's stick to the loop above: 
        // 1. Add 12 months of contributions (simplified as linear addition during year)
        // 2. Apply interest on the balance at start of year? Or average?
        // Better implementation:
        // Iterate months.
        // If monthly compound: add interest every month.
        // If yearly compound: accumulate interest, add at end of year.
        
        // Re-do loop for year i
        currentAmount = yearStartAmount; // Reset to start of year
        // We need to track principal separately from amount to get accurate total principal
        // Actually totalPrincipal is global accumulator.
        
        // Let's use a month loop for everything to be safe
      }
      
      // Let's rewrite the outer loop to be simpler and just use one core logic block
    }
    
    // RESTART CALCULATION LOGIC CLEANLY
    let balance = principal;
    let totalContributed = principal;
    const data = [];

    for (let y = 1; y <= time; y++) {
        if (compoundFreq === 'monthly') {
            for (let m = 0; m < 12; m++) {
                balance = (balance + contribution) * (1 + monthlyRate);
                totalContributed += contribution;
            }
        } else {
            // Yearly compounding
            // We assume monthly contributions don't earn interest until the end of the year in strict yearly compounding?
            // Or usually people mean "Effective Annual Rate"?
            // Let's do: Contributions are added monthly (no interest generated during the year on them), 
            // and interest is applied on the Year Start Balance.
            // AND we need to decide if contributions get interest? 
            // A common simple bank model: Interest on minimum monthly balance?
            // Let's stick to a standard:
            // Yearly Compounding: Interest = Balance * Rate. New Balance = Balance + Interest + YearlyContributions.
            // But user says "Monthly Contribution".
            // Let's assume contributions happen throughout the year.
            // For 'Yearly', let's treat it as: Add contributions, then compound at end of year?
            // Or Compound start balance, then add contributions?
            // Let's go with: Interest is calculated on the balance at the START of the year.
            const interestEarned = balance * yearlyRate;
            balance += interestEarned;
            balance += (contribution * 12);
            totalContributed += (contribution * 12);
        }
        
        data.push({
            year: y,
            amount: balance,
            principal: totalContributed,
            interest: balance - totalContributed
        });
    }

    setResult({
      totalAmount: balance,
      totalPrincipal: totalContributed,
      totalInterest: balance - totalContributed,
      yearlyData: data
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(val);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SEO 
        title={t('investment-return.title')}
        description={t('investment-return.desc')}
        keywords={["investment calculator", "return on investment", "compound interest", "投资收益", "复利计算"]}
      />

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-8 w-8" />
            <h1 className="text-3xl font-bold">{t('investment-return.name')}</h1>
          </div>
          <p className="text-blue-100 opacity-90 text-lg">
            {t('investment-return.subtitle')}
          </p>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('investment-return.initial_amount')}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">¥</span>
                </div>
                <input
                  type="number"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  className="block w-full pl-7 pr-12 py-3 border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('investment-return.rate')}
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="block w-full pl-3 pr-12 py-3 border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('investment-return.years')}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">{t('investment-return.year_unit')}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('investment-return.monthly_contribution')}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">¥</span>
                </div>
                <input
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  className="block w-full pl-7 pr-12 py-3 border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('investment-return.compound_freq')}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="monthly"
                    checked={compoundFreq === 'monthly'}
                    onChange={() => setCompoundFreq('monthly')}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-gray-700">{t('investment-return.freq_monthly')}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="yearly"
                    checked={compoundFreq === 'yearly'}
                    onChange={() => setCompoundFreq('yearly')}
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-gray-700">{t('investment-return.freq_yearly')}</span>
                </label>
              </div>
            </div>

            <button
              onClick={calculate}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              {t('investment-return.calculate_btn')}
            </button>
          </div>

          {/* Result Section */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              {t('investment-return.result_title')}
            </h3>

            {result ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('investment-return.total_amount')}</p>
                  <p className="text-3xl font-bold text-indigo-600">{formatCurrency(result.totalAmount)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">{t('investment-return.total_principal')}</p>
                    <p className="text-xl font-semibold text-gray-900">{formatCurrency(result.totalPrincipal)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">{t('investment-return.total_interest')}</p>
                    <p className="text-xl font-semibold text-green-600">{formatCurrency(result.totalInterest)}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{t('investment-return.schedule_title')}</h4>
                  <div className="max-h-64 overflow-y-auto border rounded-lg bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('investment-return.year_col')}</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('investment-return.amount_col')}</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('investment-return.interest_col')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.yearlyData.map((row) => (
                          <tr key={row.year} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row.year}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(row.amount)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600 text-right">{formatCurrency(row.interest)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <TrendingUp className="h-12 w-12 mb-2 opacity-20" />
                <p>{t('investment-return.empty_tip')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentReturnCalculator;
