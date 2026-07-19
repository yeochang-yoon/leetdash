import Link from "next/link";
import { notFound } from "next/navigation";
import { catalog } from "@/lib/catalog";
import { formatPercent } from "@/lib/format";
import { formatCatalogListTitle } from "@/lib/i18n";
import { getListDetail } from "@/lib/progress";

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.lists.map((list) => ({ listKey: list.key }));
}

export default async function ListDetailPage({ params }: { params: Promise<{ listKey: string }> }) {
  const { listKey } = await params;
  const detail = await getListDetail(listKey);
  if (!detail) {
    notFound();
  }

  const { list, users } = detail;
  const displayTitle = formatCatalogListTitle(list.title);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">문제 목록</p>
          <h1>{displayTitle}</h1>
          <p className="lede">
            정렬된 문제 {list.items.length}개.{" "}
            <a className="problem-link" href={list.url} target="_blank" rel="noreferrer">
              원본 목록 열기
            </a>
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>순위</h2>
            <p className="panel-subtitle">풀이율 기준으로 정렬했습니다</p>
          </div>
        </div>
        {users.length === 0 ? (
          <div className="empty">등록된 활성 사용자가 없습니다.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>사용자</th>
                  <th>진행률</th>
                  <th>검토 중</th>
                  <th>건너뜀</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id}>
                    <td className="mono">{index + 1}</td>
                    <td className="user-cell">
                      <Link className="user-name" href={`/users/${user.id}`}>
                        {user.displayName}
                      </Link>
                      <span className="muted mono">@{user.githubUsername}</span>
                    </td>
                    <td className="progress-cell">
                      <div className="progress-meta">
                        <strong>{formatPercent(user.progress.percent)}</strong>
                        <span className="mono">
                          {user.progress.solved}/{user.progress.total}
                        </span>
                      </div>
                      <div className="bar">
                        <div className="bar-fill" style={{ width: `${Math.min(user.progress.percent, 100)}%` }} />
                      </div>
                    </td>
                    <td className="mono">{user.progress.reviewing}</td>
                    <td className="mono">{user.progress.skipped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
