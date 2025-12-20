import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, DollarSign, PieChart, Info } from 'lucide-react';
import { SEO } from '@/components/SEO';

type LoanType = 'commercial' | 'provident' | 'combination';
type PaymentMethod = 'equal_principal_interest' | 'equal_principal';

interface CalculationResult {
  monthlyPayment: number; // For equal_principal_interest, or first month for equal_principal
  monthlyPaymentDecrease?: number; // For equal_principal
  totalPayment: number;
  totalInterest: number;
  months: number;
}

const MortgageCalculator: React.FC = () => {
  const { t } = useTranslation();
  
  const [loanType, setLoanType] = useState<LoanType>('commercial');
  const [commercialAmount, setCommercialAmount] = useState<number>(100); // Wan (10k)
  const [providentAmount, setProvidentAmount] = useState<number>(50); // Wan (10k)
  const [years, setYears] = useState<number>(30);
  const [commercialRate, setCommercialRate] = useState<number>(3.55); // %
  const [providentRate, setProvidentRate] = useState<number>(2.85); // %
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('equal_principal_interest');
  
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateLoan = (principal: number, rate: number, months: number, method: PaymentMethod): CalculationResult => {
    const monthlyRate = rate / 100 / 12;
    
    if (method === 'equal_principal_interest') {
      // 等额本息
      const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      const totalPayment = monthlyPayment * months;
      const totalInterest = totalPayment - principal;
      
      return {
        monthlyPayment,
        totalPayment,
        totalInterest,
        months
      };
    } else {
      // 等额本金
      const monthlyPrincipal = principal / months;
      const firstMonthInterest = principal * monthlyRate;
      const firstMonthPayment = monthlyPrincipal + firstMonthInterest;
      const totalInterest = ((months + 1) * principal * monthlyRate) / 2;
      const totalPayment = principal + totalInterest;
      const monthlyPaymentDecrease = monthlyPrincipal * monthlyRate;
      
      return {
        monthlyPayment: firstMonthPayment,
        monthlyPaymentDecrease,
        totalPayment,
        totalInterest,
        months
      };
    }
  };

  useEffect(() => {
    const months = years * 12;
    const commPrincipal = commercialAmount * 10000;
    const provPrincipal = providentAmount * 10000;

    let finalResult: CalculationResult = {
      monthlyPayment: 0,
      totalPayment: 0,
      totalInterest: 0,
      months,
      monthlyPaymentDecrease: 0
    };

    if (loanType === 'commercial') {
      finalResult = calculateLoan(commPrincipal, commercialRate, months, paymentMethod);
    } else if (loanType === 'provident') {
      finalResult = calculateLoan(provPrincipal, providentRate, months, paymentMethod);
    } else {
      const commRes = calculateLoan(commPrincipal, commercialRate, months, paymentMethod);
      const provRes = calculateLoan(provPrincipal, providentRate, months, paymentMethod);
      
      finalResult = {
        monthlyPayment: commRes.monthlyPayment + provRes.monthlyPayment,
        totalPayment: commRes.totalPayment + provRes.totalPayment,
        totalInterest: commRes.totalInterest + provRes.totalInterest,
        months,
        monthlyPaymentDecrease: (commRes.monthlyPaymentDecrease || 0) + (provRes.monthlyPaymentDecrease || 0)
      };
    }
    
    setResult(finalResult);
  }, [loanType, commercialAmount, providentAmount, years, commercialRate, providentRate, paymentMethod]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 }).format(val);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SEO 
        title={t('mortgage-calculator.title')} 
        description={t('mortgage-calculator.desc')} 
        keywords={['房贷计算器', '商业贷款', '公积金贷款', 'Mortgage Calculator', 'Loan Calculator']}
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            {t('mortgage-calculator.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('mortgage-calculator.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="space-y-6">
              
              {/* Loan Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mortgage-calculator.loan_type')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['commercial', 'provident', 'combination'] as LoanType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setLoanType(type)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        loanType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t(`mortgage-calculator.type_${type}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loan Amounts */}
              {(loanType === 'commercial' || loanType === 'combination') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('mortgage-calculator.commercial_amount')} ({t('mortgage-calculator.unit_wan')})
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">¥</span>
                    </div>
                    <input
                      type="number"
                      value={commercialAmount}
                      onChange={(e) => setCommercialAmount(Number(e.target.value))}
                      className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                    />
                  </div>
                </div>
              )}

              {(loanType === 'provident' || loanType === 'combination') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('mortgage-calculator.provident_amount')} ({t('mortgage-calculator.unit_wan')})
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">¥</span>
                    </div>
                    <input
                      type="number"
                      value={providentAmount}
                      onChange={(e) => setProvidentAmount(Number(e.target.value))}
                      className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                    />
                  </div>
                </div>
              )}

              {/* Term */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('mortgage-calculator.years')}
                </label>
                <select
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border px-3"
                >
                  {[5, 10, 15, 20, 25, 30].map(y => (
                    <option key={y} value={y}>{y} {t('mortgage-calculator.year_unit')}</option>
                  ))}
                </select>
              </div>

              {/* Rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(loanType === 'commercial' || loanType === 'combination') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('mortgage-calculator.commercial_rate')} (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={commercialRate}
                      onChange={(e) => setCommercialRate(Number(e.target.value))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border px-3"
                    />
                  </div>
                )}
                {(loanType === 'provident' || loanType === 'combination') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('mortgage-calculator.provident_rate')} (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={providentRate}
                      onChange={(e) => setProvidentRate(Number(e.target.value))}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border px-3"
                    />
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mortgage-calculator.payment_method')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('equal_principal_interest')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      paymentMethod === 'equal_principal_interest'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('mortgage-calculator.method_interest')}
                  </button>
                  <button
                    onClick={() => setPaymentMethod('equal_principal')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      paymentMethod === 'equal_principal'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('mortgage-calculator.method_principal')}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Result Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col justify-center">
            {result && (
              <div className="space-y-8">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    {paymentMethod === 'equal_principal_interest' 
                      ? t('mortgage-calculator.monthly_payment') 
                      : t('mortgage-calculator.first_month_payment')}
                  </p>
                  <p className="text-4xl font-bold text-blue-600">
                    {formatCurrency(result.monthlyPayment)}
                  </p>
                  {paymentMethod === 'equal_principal' && result.monthlyPaymentDecrease && (
                    <p className="text-sm text-gray-500 mt-2">
                      {t('mortgage-calculator.monthly_decrease', { amount: formatCurrency(result.monthlyPaymentDecrease) })}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-8 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      {t('mortgage-calculator.total_interest')}
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(result.totalInterest)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      {t('mortgage-calculator.total_payment')}
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(result.totalPayment)}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mt-6">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      {paymentMethod === 'equal_principal_interest'
                        ? t('mortgage-calculator.tip_interest')
                        : t('mortgage-calculator.tip_principal')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;
