#!/usr/bin/env node

/**
 * Generate MDX content files for Batch 1 & 2 tools
 * 
 * Reads TOOL_REGISTRY from src/data/tools.ts and generates MDX files
 * for specified tool slugs with realistic content.
 * 
 * Usage: node scripts/generate-tool-content.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Tool slugs to generate content for
const TOOL_SLUGS = [
  'hijri-calendar-converter',
  'pix-key-validator',
  'brazil-tax-id-tool',
  'withholding-tax-calculator',
  'landed-cost-calculator',
  'payment-fee-calculator',
  'cost-to-company-calculator',
  'rtl-text-length-estimator',
  'payment-deadline-calculator',
  'price-sync-simulator',
  'freelancer-retainer-calculator',
  'contract-clause-checker',
  'size-chart-converter',
  'crypto-capital-gains-calculator',
  'zakat-calculator'
];

// Output directory
const OUTPUT_DIR = join(projectRoot, 'content', 'tools');

// Pre-generated content templates for each tool
const CONTENT_TEMPLATES = {
  'hijri-calendar-converter': {
    title: 'Hijri Calendar Converter',
    description: 'Convert between Gregorian and Islamic (Hijri) calendar dates. Includes Ramadan estimates.',
    keywords: ['hijri calendar', 'gregorian to hijri', 'islamic calendar', 'ramadan converter', 'muslim dates'],
    howToUse: 'Enter any Gregorian date to convert it to the Islamic Hijri calendar, or vice versa. The tool provides accurate date conversions based on the Umm al-Qura calendar, with estimated Ramadan timing.',
    keyFeatures: [
      'Bidirectional conversion between Gregorian and Hijri calendars',
      'Ramadan timing estimates with Hijri month highlighting',
      'Support for both Um al-Qura and tabular calendar methods',
      'Automatic adjustment for leap years in both calendars'
    ],
    faq: [
      {
        q: 'How accurate is the Hijri date conversion?',
        a: 'This tool uses the Umm al-Qura calendar, which is the official civil calendar of Saudi Arabia. It provides high accuracy for modern dates, though religious dates may vary by +/- 1 day depending on moon sighting.'
      },
      {
        q: 'What is the difference between Islamic year and Hijri year?',
        a: 'They are the same. The Hijri calendar began on July 16, 622 CE (Gregorian) with the Prophet Muhammad\'s migration from Mecca to Medina. Each Hijri year is approximately 354 days long.'
      },
      {
        q: 'Can I convert a date range for multiple days?',
        a: 'Currently the tool converts single dates. For bulk conversions, you can use the tool repeatedly or export results for calendar integration.'
      }
    ]
  },

  'pix-key-validator': {
    title: 'Pix Key Validator',
    description: 'Validate and format Brazil Pix payment keys — CPF, CNPJ, email, phone, and EVP.',
    keywords: ['pix key validator', 'brazil pix', 'cpf validator', 'cnpj validator', 'pix payment', 'brazilian payment'],
    howToUse: 'Enter a Pix key in any format (CPF, CNPJ, email, phone, or EVP) to validate its format and check digit. The tool automatically formats valid keys according to Central Bank standards.',
    keyFeatures: [
      'Validates all Pix key types: CPF, CNPJ, email, phone, and random (EVP)',
      'Automatic format correction and standardization',
      'CPF/CNPJ check digit verification',
      'Phone number formatting with country code'
    ],
    faq: [
      {
        q: 'What is a Pix key in Brazil?',
        a: 'A Pix key is a unique identifier linked to a Brazilian bank account that enables instant 24/7 payments. Each person can register up to 5 keys per bank account.'
      },
      {
        q: 'How do I validate a CPF number?',
        a: 'The tool verifies CPF by checking the check digits using the standard Brazilian algorithm. It also validates that the CPF isn\'t in the list of known invalid numbers.'
      },
      {
        q: 'Can I generate Pix keys with this tool?',
        a: 'No, this tool only validates existing Pix keys. To generate a new Pix key, you need to register through your bank\'s app or website.'
      }
    ]
  },

  'brazil-tax-id-tool': {
    title: 'Brazil Tax ID Tool',
    description: 'Generate and validate Brazilian CPF and CNPJ tax IDs. Batch generation with CSV export.',
    keywords: ['brazil cpf', 'brazil cnpj', 'cpf generator', 'cnpj generator', 'brazil tax id', 'cpf validation'],
    howToUse: 'Use the validation tab to check if a CPF or CNPJ number is valid. Use the generation tab to create random but valid tax IDs for testing or development purposes.',
    keyFeatures: [
      'Validate CPF and CNPJ numbers with check digit verification',
      'Generate valid random CPF and CNPJ for testing',
      'Batch generation with CSV export for test data',
      'Format masks for easy copying'
    ],
    faq: [
      {
        q: 'What\'s the difference between CPF and CNPJ?',
        a: 'CPF (Cadastro de Pessoas Físicas) is for individual taxpayers, while CNPJ (Cadastro Nacional da Pessoa Jurídica) is for businesses. CPF has 11 digits, CNPJ has 14.'
      },
      {
        q: 'Can I use generated CPF/CNPJ for real transactions?',
        a: 'No, generated numbers are random but valid in format only. They don\'t correspond to real registered taxpayers and cannot be used for actual tax or financial transactions.'
      },
      {
        q: 'Is this tool legally compliant for business use?',
        a: 'This tool is for validation and testing purposes only. For production use, you should integrate with official government APIs like the Receita Federal services.'
      }
    ]
  },

  'withholding-tax-calculator': {
    title: 'Withholding Tax Calculator',
    description: 'Calculate withholding tax for cross-border payments across Indonesia, Vietnam, UAE, Saudi Arabia.',
    keywords: ['withholding tax', 'wht calculator', 'cross border payment', 'indonesia pph 26', 'uae tax', 'saudi withholding'],
    howToUse: 'Select the source country and recipient country, enter the payment amount, and specify the type of income. The tool calculates the applicable withholding tax rate based on tax treaty provisions.',
    keyFeatures: [
      'Support for Indonesia, Vietnam, UAE, Saudi Arabia, and more',
      'Tax treaty rate lookup based on income type',
      'Domestic rate vs treaty rate comparison',
      'Exemption eligibility check'
    ],
    faq: [
      {
        q: 'What is withholding tax?',
        a: 'Withholding tax (WHT) is a tax deducted at source on payments to non-residents. The payer withholds a percentage and remits it to the tax authority on behalf of the recipient.'
      },
      {
        q: 'How do tax treaties affect withholding rates?',
        a: 'Tax treaties typically reduce withholding rates below domestic rates. For example, Indonesia\'s domestic rate might be 20% but a treaty could reduce it to 10-15%.'
      },
      {
        q: 'Can I claim a refund of withheld taxes?',
        a: 'Yes, in most jurisdictions you can claim refunds by filing a tax return. The process varies by country - some require applications while others offer automatic refunds under certain conditions.'
      }
    ]
  },

  'landed-cost-calculator': {
    title: 'Landed Cost Calculator',
    description: 'Calculate the true landed cost of importing goods — freight, customs duties, VAT, and clearance fees.',
    keywords: ['landed cost', 'import cost', 'customs duty', 'import vat', 'freight calculator', 'incoterms'],
    howToUse: 'Enter the product value, origin country, HS code, shipping method, and additional costs. The tool calculates total landed cost including duties, VAT, and all clearance fees.',
    keyFeatures: [
      'Support for multiple incoterms (FOB, CIF, DDP, etc.)',
      'HS code lookup for accurate duty rates',
      'Multi-country support with local fee structures',
      'Breakdown of each cost component'
    ],
    faq: [
      {
        q: 'What does landed cost include?',
        a: 'Landed cost includes product cost, international freight, insurance, customs duties, import taxes (VAT/GST), port fees, customs clearance, and any other charges until goods reach your warehouse.'
      },
      {
        q: 'How accurate are the duty calculations?',
        a: 'Duty calculations are estimates based on HS code classifications. Actual rates may vary based on product-specific rules, origin preferences, and customs authority decisions.'
      },
      {
        q: 'Can I calculate for multiple products at once?',
        a: 'Currently the tool calculates for a single product. For bulk imports, you can calculate per item and sum them, or use the export feature for detailed records.'
      }
    ]
  },

  'payment-fee-calculator': {
    title: 'Payment Fee Calculator',
    description: 'Compare payment processing fees across mada, SADAD, Pix, OVO, GoPay, GCash, M-Pesa and more.',
    keywords: ['payment fee', 'mada fee', 'pix fee', 'gcash fee', 'mpesa fee', 'payment processing', 'digital payment'],
    howToUse: 'Enter the transaction amount and select the payment methods you want to compare. The tool shows total fees and net amount received for each method.',
    keyFeatures: [
      'Compare fees across 20+ payment methods globally',
      'Fixed fee vs percentage fee breakdown',
      'Monthly volume discount calculations',
      'Net effective rate comparison'
    ],
    faq: [
      {
        q: 'Why do different payment methods have different fees?',
        a: 'Fees vary based on settlement speed, fraud risk, transaction type, and market competition. Card payments typically cost more due to interchange fees, while bank transfers are often cheaper.'
      },
      {
        q: 'Are these fees updated regularly?',
        a: 'Payment processor fees change frequently. This tool provides estimates based on publicly available rates - always verify with the payment provider for accurate quotes.'
      },
      {
        q: 'Can I negotiate lower fees?',
        a: 'Yes, many payment processors offer volume discounts or custom pricing for high-volume merchants. Contact their sales teams for negotiated rates.'
      }
    ]
  },

  'cost-to-company-calculator': {
    title: 'Cost-to-Company Calculator',
    description: 'Convert between gross salary and true employer cost — includes employer social security contributions.',
    keywords: ['cost to company', 'employer cost', 'salary converter', 'gross to net', 'bpjs', 'social security'],
    howToUse: 'Enter either the gross salary or the desired net salary to see the full employer cost breakdown. The tool calculates all mandatory contributions based on the selected country.',
    keyFeatures: [
      'Support for Indonesia, UAE, Saudi Arabia, Philippines, and more',
      'Gross to net and net to gross calculations',
      'Detailed breakdown of each contribution component',
      '13th month and bonus considerations'
    ],
    faq: [
      {
        q: 'What is cost-to-company?',
        a: 'Cost-to-company (CTC) is the total amount an employer spends on an employee, including base salary, bonuses, and all mandatory employer contributions like social security and insurance.'
      },
      {
        q: 'Why is employer cost higher than gross salary?',
        a: 'Employers must pay mandatory contributions on top of gross salary - these include social security, health insurance, unemployment insurance, and in some countries, housing funds or other mandatory benefits.'
      },
      {
        q: 'Do these calculations include variable bonuses?',
        a: 'Base calculations use fixed monthly salary. For variable components like performance bonuses, you can add them separately to see their impact on total annual cost.'
      }
    ]
  },

  'rtl-text-length-estimator': {
    title: 'RTL Text Length Estimator',
    description: 'Estimate how much longer your text will be in Arabic, Hebrew, Persian, or Urdu. Avoid RTL layout surprises.',
    keywords: ['rtl text', 'arabic text length', 'rtl expansion', 'arabic ui', 'right-to-left text', 'text expansion'],
    howToUse: 'Enter your English text and select the target RTL language. The tool estimates how much wider the text will appear when translated and laid out in RTL direction.',
    keyFeatures: [
      'Support for Arabic, Hebrew, Persian, and Urdu',
      'Character count to visual width estimation',
      'Font-specific expansion factors',
      'UI layout padding recommendations'
    ],
    faq: [
      {
        q: 'Why does RTL text appear wider?',
        a: 'RTL languages use different character shapes and include diacritical marks (tashkeel) that aren\'t visible in Arabic. Additionally, Arabic script connects letters, creating different word shapes than Latin text.'
      },
      {
        q: 'How much extra space should I budget for Arabic translations?',
        a: 'Arabic text typically expands 20-40% compared to English, though this varies by content type. Legal and religious texts may expand more due to diacritical marks.'
      },
      {
        q: 'Does this apply to Hebrew too?',
        a: 'Hebrew expands less than Arabic, typically 10-20%, because it doesn\'t use as many connecting letters or diacritical marks. Persian falls between Hebrew and Arabic.'
      }
    ]
  },

  'payment-deadline-calculator': {
    title: 'Payment Deadline Calculator',
    description: 'Calculate payment due dates across Net 7/15/30/45/60/90, EOM, and 15th MF terms for multiple markets.',
    keywords: ['payment deadline', 'net 30', 'due date', 'payment terms', 'invoice due date', 'eom terms'],
    howToUse: 'Enter the invoice date and select the payment terms. The tool calculates the exact due date and shows a calendar view with the deadline highlighted.',
    keyFeatures: [
      'Support for Net 7/15/30/45/60/90 and custom terms',
      'EOM (End of Month) and 15th MF calculations',
      'Weekend and holiday adjustments',
      'Multiple invoice batch processing'
    ],
    faq: [
      {
        q: 'What do payment terms like Net 30 mean?',
        a: 'Net 30 means payment is due 30 days from the invoice date. "Net" simply means the full amount is due. Other terms like 2/10 Net 30 offer a 2% discount if paid within 10 days.'
      },
      {
        q: 'How do EOM terms work?',
        a: 'EOM (End of Month) terms mean the due date is based on the end of the invoice month, not the invoice date. For example, an invoice dated Jan 15 with Net 30 EOM would be due Feb 28/29.'
      },
      {
        q: 'What is 15th MF?',
        a: '15th MF (15th of the Following Month) is common in Southeast Asia. The due date is always the 15th of the month after the invoice month, regardless of when the invoice was issued.'
      }
    ]
  },

  'price-sync-simulator': {
    title: 'Price Sync Simulator',
    description: 'Simulate multi-platform pricing strategy. Compare profits across Shopee, TikTok Shop, Lazada, Amazon and more.',
    keywords: ['price sync', 'multi platform pricing', 'ecommerce pricing', 'platform fee comparison', 'shopee pricing'],
    howToUse: 'Enter your product cost and select the platforms to compare. The tool calculates final prices, fees, and profits for each platform based on their fee structures.',
    keyFeatures: [
      'Support for Shopee, TikTok Shop, Lazada, Amazon, Tokopedia, and more',
      'Platform fee breakdown with all cost components',
      'Profit margin comparison across platforms',
      'Price recommendation based on competitiveness'
    ],
    faq: [
      {
        q: 'How accurate are the fee calculations?',
        a: 'Fees are based on publicly available rate cards but may not include all-specific promotions or negotiated rates. Always verify with the platform for exact quotes.'
      },
      {
        q: 'Should I use the same price on all platforms?',
        a: 'Not necessarily. Different platforms have different fee structures and customer expectations. Some sellers adjust prices based on platform-specific promotions or competition.'
      },
      {
        q: 'What other costs should I consider?',
        a: 'Beyond platform fees, consider storage costs, return rates, advertising spend, currency conversion, and your time. These significantly affect true profitability.'
      }
    ]
  },

  'freelancer-retainer-calculator': {
    title: 'Freelancer Retainer Calculator',
    description: 'Convert hourly or project rates into monthly retainer quotes. Includes overhead and tax estimates.',
    keywords: ['freelancer rate', 'retainer calculator', 'hourly to monthly', 'freelance pricing', 'consultant rate'],
    howToUse: 'Enter your hourly rate or project price, expected hours per month, and desired profit margin. The tool calculates a recommended monthly retainer with tax and overhead adjustments.',
    keyFeatures: [
      'Convert hourly/project rates to monthly retainer',
      'Tax estimation for freelancers in multiple countries',
      'Overhead cost allocation (software, equipment, insurance)',
      'Profit margin adjustment slider'
    ],
    faq: [
      {
        q: 'Why should I charge more for a retainer?',
        a: 'Retainers provide guaranteed recurring income and reduce business development costs. In exchange for this commitment, clients typically get priority access and slightly reduced rates - but you should still charge a premium for guaranteed hours.'
      },
      {
        q: 'How do I calculate my true hourly rate?',
        a: 'Divide your target annual income by workable billable hours (typically 1,500-1,800/year accounting for admin, marketing, and holidays). Also add 30% for taxes and business expenses.'
      },
      {
        q: 'What\'s a typical retainer structure?',
        a: 'Common structures include: fixed monthly hours at discounted rate, fixed monthly fee for defined scope, or hybrid with base retainer plus additional hours at regular rate. Choose based on client predictability needs.'
      }
    ]
  },

  'contract-clause-checker': {
    title: 'Contract Clause Checker',
    description: 'Check employment contract clauses against local labor laws in Saudi Arabia, Indonesia, Vietnam, UAE and Philippines.',
    keywords: ['contract checker', 'labor law', 'employment contract', 'saudi labor law', 'indonesia uu13', 'labor compliance'],
    howToUse: 'Select the country, enter or paste contract clauses, and the tool analyzes them against local labor law requirements. It highlights potential issues and suggests compliant alternatives.',
    keyFeatures: [
      'Check clauses against Saudi Arabia, Indonesia, Vietnam, UAE, and Philippines labor laws',
      'Identify non-compliant terms and provide suggestions',
      'Required clause checklist for each country',
      'Language considerations for local requirements'
    ],
    faq: [
      {
        q: 'What labor laws does this tool check against?',
        a: 'The tool checks against key regulations: Saudi Arabia (Labor Law and Nitaqat), Indonesia (UU 13/2003 and amendments), Vietnam (Labor Code 2019), UAE (Federal Labor Law), and Philippines (Labor Code).'
      },
      {
        q: 'Can this tool replace legal advice?',
        a: 'No, this tool provides general guidance only. Employment law is complex and fact-specific. Always consult a qualified labor attorney for important contracts or disputes.'
      },
      {
        q: 'What are the most common contract issues?',
        a: 'Common issues include: unclear termination notice periods, inadequate overtime compensation, missing required benefits, non-compete clauses that exceed legal limits, and unclear probation terms.'
      }
    ]
  },

  'size-chart-converter': {
    title: 'Size Chart Converter',
    description: 'Convert clothing and shoe sizes across US, EU, UK, China, Japan, Indonesia, Philippines, Brazil and more.',
    keywords: ['size chart', 'clothing size', 'shoe size', 'size converter', 'asia sizing', 'international sizes'],
    howToUse: 'Select the size type (clothing or shoes), enter a size from one region, and see the equivalent sizes across all supported regions. Perfect for cross-border e-commerce.',
    keyFeatures: [
      'Convert clothing sizes for US, UK, EU, China, Japan, Indonesia, Philippines, Brazil, and more',
      'Shoe size conversions for men, women, and children',
      'Brand-specific size guides where available',
      'Visual size comparison charts'
    ],
    faq: [
      {
        q: 'Why do sizes differ so much between countries?',
        a: 'Size standards evolved independently in each region. For example, US sizes are based on body measurements in inches, while EU sizes use centimeters. Even "Large" means different actual dimensions in different markets.'
      },
      {
        q: 'Are conversions always exact?',
        a: 'Conversions are approximate because sizing standards vary by brand and manufacturer. Use this as a starting guide, but always check specific brand size charts when possible.'
      },
      {
        q: 'What about plus sizes and petite sizes?',
        a: 'This tool covers standard sizes. Plus and petite sizing varies significantly by brand and often has different conversion logic. Check brand-specific guides for these categories.'
      }
    ]
  },

  'crypto-capital-gains-calculator': {
    title: 'Crypto Capital Gains Calculator',
    description: 'Calculate crypto capital gains tax for Brazil and Kenya.',
    keywords: ['crypto tax', 'bitcoin tax', 'ethereum tax', 'capital gains', 'brazil crypto', 'kenya crypto'],
    howToUse: 'Enter your cryptocurrency transactions (buy price, sell price, date) and the tool calculates capital gains or losses. Select your country for tax rule compliance.',
    keyFeatures: [
      'Calculate capital gains for Brazil and Kenya tax rules',
      'Support for FIFO, LIFO, and specific identification methods',
      'Import transactions from CSV',
      'Annual tax summary report'
    ],
    faq: [
      {
        q: 'How is crypto capital gains tax calculated?',
        a: 'In most jurisdictions, you calculate gain/loss as (Sell Price - Buy Price) × Quantity. If you hold for over a year, you may qualify for lower long-term capital gains rates.'
      },
      {
        q: 'What record-keeping do I need?',
        a: 'Keep records of: date of acquisition, purchase price, sale date, sale price, transaction fees, and wallet addresses. Brazil requires detailed annual reporting to the tax authority.'
      },
      {
        q: 'Can I offset gains with losses?',
        a: 'Yes, in most jurisdictions you can offset capital gains with capital losses. Brazil allows up to offset against other capital gains, while Kenya allows deduction from gains in the same year.'
      }
    ]
  },

  'zakat-calculator': {
    title: 'Zakat Calculator',
    description: 'Calculate Islamic Zakat al-mal with gold/silver Nisab thresholds. Multi-currency support.',
    keywords: ['zakat calculator', 'islamic charity', 'nisab', 'zakat al mal', 'gold nisab', 'zakat calculation'],
    howToUse: 'Enter your total wealth in cash, gold, silver, and investments. The tool calculates the Nisab threshold based on current gold/silver prices and determines your Zakat obligation.',
    keyFeatures: [
      'Calculate Zakat on cash, gold, silver, and investments',
      'Automatic Nisab threshold calculation using current precious metal prices',
      'Multi-currency support with real-time exchange rates',
      'Zakat distribution recommendations'
    ],
    faq: [
      {
        q: 'What is Nisab?',
        a: 'Nisab is the minimum wealth threshold that triggers Zakat obligation. It equals 87.48 grams of gold or 612.36 grams of silver. The tool uses current market prices to calculate this in your currency.'
      },
      {
        q: 'Which assets are subject to Zakat?',
        a: 'Zakat applies to: cash, gold/silver, trade goods, agricultural produce, and livestock. Exclusions include primary residence, personal vehicle, and household items.'
      },
      {
        q: 'When should Zakat be paid?',
        a: 'Zakat becomes due when wealth exceeds Nisab for one lunar year (Hawl). Most Muslims pay during Ramadan, though it can be paid anytime the conditions are met.'
      }
    ]
  }
};

function readToolsRegistry() {
  const toolsPath = join(projectRoot, 'src', 'data', 'tools.ts');
  const content = readFileSync(toolsPath, 'utf-8');
  
  // Extract tool info using regex since we can't use full TS parser
  const toolData = {};
  
  for (const slug of TOOL_SLUGS) {
    // Find the tool entry in the file
    const idPattern = new RegExp(`id:\\s*["']${slug}["']`, 'i');
    const match = content.match(idPattern);
    
    if (match) {
      // Find the surrounding tool block (approximately)
      const startIdx = content.indexOf('id:', match.index);
      // Find the next tool or end of array
      const nextIdMatch = content.match(/\n\s+id:\s*["']/, startIdx + 10);
      const endIdx = nextIdMatch ? nextIdMatch.index : content.indexOf('];', startIdx);
      
      const toolBlock = content.substring(startIdx, endIdx);
      
      // Extract name
      const nameMatch = toolBlock.match(/name:\s*"([^"]+)"/);
      const descMatch = toolBlock.match(/description:\s*"([^"]+)"/);
      const kwMatch = toolBlock.match(/keywords:\s*\[([^\]]+)\]/);
      
      toolData[slug] = {
        name: nameMatch ? nameMatch[1] : null,
        description: descMatch ? descMatch[1] : null,
        keywordsRaw: kwMatch ? kwMatch[1] : null
      };
    }
  }
  
  return toolData;
}

function parseKeywords(keywordsRaw) {
  if (!keywordsRaw) return [];
  // Extract quoted strings from keywords array
  const matches = keywordsRaw.match(/"([^"]+)"/g);
  if (matches) {
    return matches.map(m => m.replace(/"/g, ''));
  }
  return [];
}

function generateMdxContent(toolId, toolInfo) {
  const template = CONTENT_TEMPLATES[toolId];
  if (!template) {
    console.warn(`No content template found for ${toolId}, using generic content`);
    return generateGenericMdx(toolId, toolInfo);
  }
  
  const keywords = template.keywords.join(', ');
  const lastUpdated = new Date().toISOString().split('T')[0];
  
  let faqContent = '';
  for (const faq of template.faq) {
    faqContent += `
### ${faq.q}

${faq.a}
`;
  }
  
  return `---
title: "${template.title}"
description: "${template.description}"
keywords: [${template.keywords.map(k => `"${k}"`).join(', ')}]
toolId: "${toolId}"
lang: "en"
lastUpdated: "${lastUpdated}"
---

# ${template.title}

${template.description}

## How to Use

${template.howToUse}

## Key Features

${template.keyFeatures.map(f => `- ${f}`).join('\n')}

## FAQ

${faqContent}
`;
}

function generateGenericMdx(toolId, toolInfo) {
  const name = toolInfo?.name || toolId;
  const description = toolInfo?.description || 'A useful tool for business calculations and conversions.';
  const keywords = toolInfo?.keywords || [toolId];
  const lastUpdated = new Date().toISOString().split('T')[0];
  
  return `---
title: "${name}"
description: "${description}"
keywords: [${keywords.map(k => `"${k}"`).join(', ')}]
toolId: "${toolId}"
lang: "en"
lastUpdated: "${lastUpdated}"
---

# ${name}

${description}

## How to Use

Enter your values and the tool will calculate the result. Adjust parameters as needed for your specific use case.

## Key Features

- Accurate calculations based on current standards
- Easy-to-use interface
- Instant results
- Exportable results

## FAQ

### How accurate are the calculations?

The tool uses standard formulas and rates. For critical decisions, verify with official sources.

### Is this tool free to use?

Yes, this tool is free for personal and commercial use.

### Can I save my results?

You can copy or screenshot your results for record-keeping.
`;
}

function main() {
  console.log('Generating MDX content for Batch 1 & 2 tools...\n');
  
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }
  
  // Read tool registry for additional info
  const toolRegistry = readToolsRegistry();
  
  let generated = 0;
  let skipped = 0;
  
  for (const slug of TOOL_SLUGS) {
    const outputPath = join(OUTPUT_DIR, `${slug}.mdx`);
    
    // Check if file already exists
    if (existsSync(outputPath)) {
      console.log(`⏭️  Skipping ${slug} (already exists)`);
      skipped++;
      continue;
    }
    
    // Get tool info from registry
    const toolInfo = toolRegistry[slug] || {};
    
    // Generate MDX content
    const content = generateMdxContent(slug, toolInfo);
    
    // Write file
    writeFileSync(outputPath, content, 'utf-8');
    console.log(`✅ Generated: ${slug}.mdx`);
    generated++;
  }
  
  console.log(`\n✓ Done! Generated ${generated} files, skipped ${skipped} existing files.`);
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
}

main();
