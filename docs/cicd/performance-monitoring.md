# Performance Monitoring Guide

## Overview

SlideHeroes uses Lighthouse CI to monitor and enforce performance budgets across staging and production environments. This ensures optimal user experience and maintains Core Web Vitals compliance.

## Performance Targets

### Core Web Vitals

- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Additional Metrics

- **First Contentful Paint (FCP)**: < 1.8s
- **Speed Index**: < 3.4s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Blocking Time (TBT)**: < 200ms

### Score Thresholds

#### Production Environment

- **Target Score**: ≥ 95/100
- **Critical Threshold**: < 90/100 (triggers alerts)

#### Staging Environment

- **Target Score**: ≥ 90/100
- **Critical Threshold**: < 85/100 (triggers alerts)

## Monitoring Schedule

### Continuous Monitoring

- **On Deploy**: Automatically after staging/production deployments
- **Daily Checks**: 2 AM UTC for both environments
- **Weekly Reports**: Generated every Monday

### Manual Runs

```bash
# Trigger performance check manually
gh workflow run performance-monitor.yml -f environment=staging
```

## Lighthouse Configuration

The performance budgets are defined in `lighthouserc.json`:

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
        // ... additional assertions
      }
    }
  }
}
```

## Alert Channels

### GitHub Issues

- Critical regressions automatically create high-priority issues
- Tagged with `performance` and `ci/cd` labels

### Slack Notifications (Optional)

- Configure `SLACK_WEBHOOK_URL` secret for team notifications
- Critical and warning alerts sent to designated channel

### Pull Request Comments

- Performance scores posted on PRs automatically
- Includes Core Web Vitals summary and trend indicators

## Debugging Performance Issues

### 1. Review Lighthouse Reports

- Check artifacts in GitHub Actions run
- Download HTML reports for detailed analysis

### 2. Common Issues

- **Large JavaScript bundles**: Review bundle analyzer output
- **Unoptimized images**: Check for missing responsive images
- **Layout shifts**: Ensure proper size attributes on media
- **Render blocking resources**: Review critical CSS/JS

### 3. Local Testing

```bash
# Run Lighthouse locally
pnpm add -g @lhci/cli
lhci autorun

# Analyze bundle size
pnpm --filter web analyze
```

## Performance Optimization Checklist

### Before Deployment

- [ ] Run local Lighthouse tests
- [ ] Check bundle size impact
- [ ] Verify image optimization
- [ ] Test on slower connections

### After Regression Alert

1. Review recent commits for performance impact
2. Check third-party script changes
3. Analyze bundle size differences
4. Profile runtime performance
5. Test fixes locally before deploying

## Integration with CI/CD

### Staging Workflow

```yaml
performance-test:
  uses: ./.github/workflows/lighthouse-ci.yml
  with:
    target_url: ${{ needs.deploy.outputs.url }}
    environment: staging
```

### Enforcement

- Performance tests block deployment on critical regressions
- Non-critical warnings allow deployment but create tracking issues

## Metrics Dashboard

### Viewing Trends

1. Check GitHub Actions insights for historical data
2. Review weekly performance reports in issues
3. Monitor Vercel Analytics for real user metrics

### Key Performance Indicators

- Average performance score over time
- Core Web Vitals pass rate
- Regression frequency
- Time to resolution for performance issues

## Best Practices

1. **Preventive Monitoring**: Address warnings before they become critical
2. **Bundle Budget**: Keep JavaScript under 300KB compressed
3. **Image Optimization**: Use next/image for automatic optimization
4. **Code Splitting**: Leverage dynamic imports for large features
5. **Third-party Scripts**: Load non-critical scripts asynchronously

## Troubleshooting

### False Positives

- Network variability: Run multiple test iterations
- Cold cache effects: Check warm load performance
- Server response times: Verify backend performance

### Configuration Updates

- Adjust thresholds based on user feedback
- Update assertions as performance improves
- Add route-specific budgets for critical pages

---

For questions or improvements to performance monitoring, please create an issue with the `performance` label.
