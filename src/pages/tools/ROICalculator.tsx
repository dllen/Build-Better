import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/SEO';
import { Percent, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';

interface CalculationResult {
  roi: number;
  netProfit: number;
  annualizedRoi?: number;
}

const ROICalculator = () => {
  const { t } = useTranslation();
  
  const [investedAmount, setInvestedAmount] = useState<string>('0');
  const [returnedAmount, setReturnedAmount] = useState<string>('0');
  const [timePeriod, setTimePeriod] = useState<string>('0');
  const [timeUnit, setTimeUnit] = useState<'years' | 'months'>('years');

  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculate = () => {
    const invested = parseFloat(investedAmount);
    const returned = parseFloat(returnedAmount);
    const time = parseFloat(timePeriod);

    if (isNaN(invested) || isNaN(returned) || invested === 0) {
      return;
    }

    const netProfit = returned - invested;
    const roi = (netProfit / invested) * 100;

    let annualizedRoi = undefined;
    if (time > 0) {
      const years = timeUnit === 'months' ? time / 12 : time;
      // Annualized ROI formula: ((Final Value / Initial Value) ^ (1/n)) - 1
      // Only valid if Final Value (returned) is positive
      if (returned > 0) {
         annualizedRoi = (Math.pow(returned / invested, 1 / years) - 1) * 100;
      }
    }

    setResult({
      roi,
      netProfit,
      annualizedRoi
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(val);
  };

  const formatPercent = (val: number) => {
    return `${val.toFixed(2)}%`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SEO 
        title={t('roi-calculator.title')}
        description={t('roi-calculator.desc')}
        keywords={["roi calculator", "return on investment", "investment return", "ROI计算", "投资回报率"]}
      />

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Percent className="h-8 w-8" />
            <h1 className="text-3xl font-bold">{t('roi-calculator.name')}</h1>
          </div>
          <p className="text-emerald-100 opacity-90 text-lg">
            {t('roi-calculator.subtitle')}
          </p>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('roi-calculator.invested_amount')}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">¥</span>
                </div>
                <input
                  type="number"
                  value={investedAmount}
                  onChange={(e) => setInvestedAmount(e.target.value)}
                  className="block w-full pl-7 pr-12 py-3 border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('roi-calculator.returned_amount')}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">¥</span>
                </div>
                <input
                  type="number"
                  value={returnedAmount}
                  onChange={(e) => setReturnedAmount(e.target.value)}
                  className="block w-full pl-7 pr-12 py-3 border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('roi-calculator.time_period')} <span className="text-gray-400 font-normal">({t('roi-calculator.optional')})</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  className="block w-full px-3 py-3 border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="0"
                />
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value as 'years' | 'months')}
                  className="block w-32 pl-3 pr-10 py-3 border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="years">{t('roi-calculator.unit_years')}</option>
                  <option value="months">{t('roi-calculator.unit_months')}</option>
                </select>
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('roi-calculator.time_tip')}</p>
            </div>

            <button
              onClick={calculate}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              {t('roi-calculator.calculate_btn')}
            </button>
          </div>

          {/* Result Section */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              {t('roi-calculator.result_title')}
            </h3>

            {result ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('roi-calculator.roi')}</p>
                  <div className={`text-4xl font-bold ${result.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(result.roi)}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">{t('roi-calculator.net_profit')}</p>
                  <p className={`text-2xl font-semibold ${result.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatCurrency(result.netProfit)}
                  </p>
                </div>

                {result.annualizedRoi !== undefined && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">{t('roi-calculator.annualized_roi')}</p>
                    <p className={`text-xl font-semibold ${result.annualizedRoi >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatPercent(result.annualizedRoi)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{t('roi-calculator.annualized_tip')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <AlertCircle className="h-12 w-12 mb-2 opacity-20" />
                <p>{t('roi-calculator.empty_tip')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;
