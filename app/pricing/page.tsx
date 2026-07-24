'use client';

import { useState } from 'react';
import { getAnnualPrice } from '../../lib/pricing';
import styles from './page.module.css';

const tiers = [
  {
    name: 'Starter',
    monthlyPrice: 10,
    features: ['1 workspace', 'Up to 3 users', 'Email support'],
  },
  {
    name: 'Pro',
    monthlyPrice: 30,
    features: ['5 workspaces', 'Up to 20 users', 'Priority support'],
  },
  {
    name: 'Team',
    monthlyPrice: 60,
    features: ['Unlimited workspaces', 'Unlimited users', '24/7 dedicated support'],
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Simple, transparent pricing</h1>
      <p className={styles.subheading}>Start free. Scale as you grow.</p>

      <div className={styles.toggle}>
        <span className={`${styles.toggleLabel} ${!annual ? styles.toggleLabelActive : ''}`}>
          Monthly
        </span>
        <button
          className={styles.toggleSwitch}
          onClick={() => setAnnual((v) => !v)}
          aria-label="Toggle billing period"
        >
          <span className={`${styles.toggleThumb} ${annual ? styles.toggleThumbRight : ''}`} />
        </button>
        <span className={`${styles.toggleLabel} ${annual ? styles.toggleLabelActive : ''}`}>
          Annual
        </span>
        {annual && <span className={styles.saveBadge}>Save 20%</span>}
      </div>

      <div className={styles.grid}>
        {tiers.map((tier) => (
          <div key={tier.name} className={styles.card}>
            <h2 className={styles.tierName}>{tier.name}</h2>
            <div className={styles.price}>
              <span className={styles.currency}>$</span>
              <span className={styles.amount}>
                {annual ? getAnnualPrice(tier.monthlyPrice) : tier.monthlyPrice}
              </span>
              <span className={styles.period}>/{annual ? 'yr' : 'mo'}</span>
            </div>
            {annual && <span className={styles.cardBadge}>Save 20%</span>}
            <ul className={styles.features}>
              {tier.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button className={styles.cta}>Get started</button>
          </div>
        ))}
      </div>
    </main>
  );
}
