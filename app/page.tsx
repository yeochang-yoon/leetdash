import Link from "next/link";
import { Clock3 } from "lucide-react";
import { DashboardUserLists } from "@/app/components/dashboard-user-lists";
import { formatDateTime, formatPercent, formatSnapshotDateTime } from "@/lib/format";
import { getGithubProfileUrl } from "@/lib/github";
import { formatCatalogListTitle } from "@/lib/i18n";
import { getDashboardData } from "@/lib/progress";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">master 브랜치 스냅샷</p>
          <h1>스터디 진행 현황 대시보드</h1>
          <p className="lede">
            이 저장소에 체크인된 풀이 제출물을 추적합니다. 변경 사항이 master에 병합되고 사이트가 다시 빌드되면
            진행 현황이 업데이트됩니다.
          </p>
        </div>
      </div>

      <section className="stats-grid" aria-label="요약">
        <div className="stat">
          <div className="stat-label">활성 사용자</div>
          <div className="stat-value">{data.totals.users}</div>
        </div>
        <div className="stat">
          <div className="stat-label">추적 목록</div>
          <div className="stat-value">{data.totals.lists}</div>
        </div>
        <div className="stat">
          <div className="stat-label">고유 문제</div>
          <div className="stat-value">{data.totals.uniqueProblems}</div>
        </div>
        <div className="stat">
          <div className="stat-label">스냅샷</div>
          <div className="stat-value snapshot-value">{formatSnapshotDateTime(data.generatedAt)}</div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>최근 풀이 제출</h2>
            <p className="panel-subtitle">커밋 히스토리 기준으로 최근 완료된 풀이 5개까지 표시합니다</p>
          </div>
          <Clock3 size={18} aria-hidden="true" className="panel-icon" />
        </div>
        {data.recentSolvedSubmissions.length === 0 ? (
          <div className="empty">아직 커밋 시간이 확인된 풀이 제출이 없습니다.</div>
        ) : (
          <div className="recent-submission-list">
            {data.recentSolvedSubmissions.map((submission) => (
              <div className="recent-submission-item" key={`${submission.userId}:${submission.problemSlug}`}>
                <div>
                  <Link className="user-name compact" href={`/users/${submission.userId}`}>
                    {submission.displayName}
                  </Link>
                  <a
                    className="muted mono github-link"
                    href={getGithubProfileUrl(submission.githubUsername)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{submission.githubUsername}
                  </a>
                </div>
                <div>
                  {submission.githubUrl ? (
                    <a className="problem-title problem-link" href={submission.githubUrl} target="_blank" rel="noreferrer">
                      {submission.problemTitle}
                    </a>
                  ) : (
                    <span className="problem-title">{submission.problemTitle}</span>
                  )}
                  <div className="muted">{formatCatalogListTitle(submission.listTitle)}</div>
                </div>
                <div className="recent-submission-time">{formatDateTime(submission.submittedAt)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="list-grid" aria-label="목록 평균">
        {data.listAverages.map((list) => (
          <Link className="list-card" href={`/lists/${list.key}`} key={list.key}>
            <h3>{formatCatalogListTitle(list.title)}</h3>
            <div className="progress-meta">
              <span className="muted">평균 완료율</span>
              <strong>{formatPercent(list.average)}</strong>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${Math.min(list.average, 100)}%` }} />
            </div>
          </Link>
        ))}
      </section>

      <DashboardUserLists users={data.users} />
    </div>
  );
}
