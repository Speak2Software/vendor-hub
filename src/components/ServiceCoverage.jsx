import { Link } from 'react-router-dom'
import { categoryIcon, serviceCoverage } from '../utils/serviceCategories'

/**
 * At-a-glance view of which service areas the community has approved vendors
 * for (and how many), and which are still uncovered.
 */
export default function ServiceCoverage({ approved = [] }) {
  const { covered, gaps, coveredCount, totalCount, percent } = serviceCoverage(approved)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800">Service Coverage</h2>
        <span className="text-xs font-semibold text-gray-500">
          {coveredCount} of {totalCount} areas covered
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-sm font-extrabold text-gray-700 tabular-nums flex-shrink-0">{percent}%</span>
        </div>

        {/* Covered */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Covered
          </p>
          {covered.length === 0 ? (
            <p className="text-xs text-gray-400 italic bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              No approved vendors yet — approve an application to start covering service areas.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {covered.map(({ category, count }) => (
                <span
                  key={category}
                  title={`${count} approved vendor${count !== 1 ? 's' : ''}`}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full pl-2.5 pr-1.5 py-1.5 text-xs font-semibold"
                >
                  <span className="text-sm leading-none">{categoryIcon(category)}</span>
                  <span>{category}</span>
                  <span className="inline-flex items-center justify-center min-w-[19px] h-[19px] px-1 rounded-full bg-emerald-600 text-white text-[11px] font-black tabular-nums">
                    {count}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Gaps */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            Not Covered
            {gaps.length > 0 && <span className="text-gray-300 font-semibold normal-case tracking-normal">· {gaps.length}</span>}
          </p>
          {gaps.length === 0 ? (
            <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
              🎉 Every service area is covered.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {gaps.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1.5 bg-gray-50 border border-dashed border-gray-300 text-gray-400 rounded-full px-2.5 py-1.5 text-xs font-medium"
                  >
                    <span className="text-sm leading-none grayscale opacity-60">{categoryIcon(category)}</span>
                    <span>{category}</span>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
                <Link to="/manager/map" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                  Find vendors near you
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
                <Link to="/manager/communications?tab=flyer" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                  Print a recruitment flyer
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
