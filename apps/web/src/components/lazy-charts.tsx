import type { RatingSeriesPoint, SummaryDto } from '@ecoconception/shared';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

const ChartsImpl = lazy(async () => ({
  default: (await import('@/components/charts-impl')).ChartsImpl
}));

type LazyChartsProps = {
  ratingPoints: RatingSeriesPoint[];
  byTimeClass: SummaryDto['byTimeClass'];
};

export function LazyCharts({ ratingPoints, byTimeClass }: LazyChartsProps) {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoadCharts, setShouldLoadCharts] = useState(false);

  useEffect(() => {
    if (shouldLoadCharts) {
      return;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setShouldLoadCharts(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadCharts(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px' }
    );

    const element = triggerRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [shouldLoadCharts]);

  return (
    <div ref={triggerRef} className="grid gap-4 lg:grid-cols-2">
      {shouldLoadCharts ? (
        <Suspense fallback={<Skeleton className="h-80 bg-stone-100/10 lg:col-span-2" />}>
          <ChartsImpl ratingPoints={ratingPoints} byTimeClass={byTimeClass} />
        </Suspense>
      ) : (
        <Skeleton className="h-80 bg-stone-100/10 lg:col-span-2" />
      )}
    </div>
  );
}
