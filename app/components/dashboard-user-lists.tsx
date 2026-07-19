import Link from "next/link";
import { Users } from "lucide-react";
import { ActivityCalendar } from "@/app/components/activity-calendar";
import { formatDateKey, formatDateTime, formatPercent } from "@/lib/format";
import { getGithubProfileUrl } from "@/lib/github";
import { formatCatalogListTitle } from "@/lib/i18n";
import type { UserDashboardRow } from "@/lib/progress";

function ProgressCell({
  listKey,
  title,
  solved,
  total,
  percent,
}: {
  listKey: string;
  title: string;
  solved: number;
  total: number;
  percent: number;
}) {
  const displayTitle = formatCatalogListTitle(title);

  return (
    <div className="progress-cell">
      <div className="progress-meta">
        <Link className="problem-link" href={`/lists/${listKey}`}>
          {displayTitle}
        </Link>
        <span className="mono">
          {solved}/{total}
        </span>
      </div>
      <div className="bar" aria-label={`${displayTitle} ${formatPercent(percent)} 완료`}>
        <div className="bar-fill" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </div>
  );
}

function UserIdentity({ user }: { user: UserDashboardRow }) {
  return (
    <div className="user-cell">
      <Link className="user-name" href={`/users/${user.id}`}>
        {user.displayName}
      </Link>
      <a
        className="muted mono github-link"
        href={getGithubProfileUrl(user.githubUsername)}
        target="_blank"
        rel="noreferrer"
      >
        @{user.githubUsername}
      </a>
    </div>
  );
}

export function DashboardUserLists({ users }: { users: UserDashboardRow[] }) {
  const progressColumns = users[0]?.progress ?? [];

  return (
    <>
      <section className="panel activity-panel" aria-labelledby="activity-title">
        <div className="panel-header">
          <div>
            <h2 id="activity-title">활동 달력</h2>
            <p className="panel-subtitle">최근 35일 동안 master에 추가된 풀이를 사용자별로 표시합니다</p>
          </div>
        </div>
        {users.length === 0 ? (
          <div className="empty">아직 등록된 활성 사용자가 없습니다. data/users.json에 참가자를 추가하세요.</div>
        ) : (
          <div className="activity-user-list">
            {users.map((user) => (
              <div className="activity-user-row" key={user.id}>
                <UserIdentity user={user} />
                <ActivityCalendar calendar={user.activityCalendar} label={`${user.displayName} 최근 35일 활동`} />
                <div className="activity-summary">
                  <span>
                    최근 35일 <strong>{user.activityCalendar.totalSolved}</strong>개
                  </span>
                  <span>최근 활동 {formatDateKey(user.activityCalendar.lastActiveDate)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>사용자</h2>
            <p className="panel-subtitle">master의 활성 참가자 폴더마다 한 행씩 표시합니다</p>
          </div>
          <Link className="button" href="/admin">
            <Users size={16} aria-hidden="true" />
            참가자
          </Link>
        </div>
        {users.length === 0 ? (
          <div className="empty">아직 등록된 활성 사용자가 없습니다. data/users.json에 참가자를 추가하세요.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>사용자</th>
                  {progressColumns.map((list) => (
                    <th key={list.key}>{formatCatalogListTitle(list.title)}</th>
                  ))}
                  <th>최근 풀이</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <UserIdentity user={user} />
                    </td>
                    {user.progress.map((progress) => (
                      <td key={progress.key}>
                        <ProgressCell
                          listKey={progress.key}
                          title={progress.title}
                          solved={progress.solved}
                          total={progress.total}
                          percent={progress.percent}
                        />
                      </td>
                    ))}
                    <td>{formatDateTime(user.recentSolvedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
