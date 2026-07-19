import { GitBranch, GitMerge, Users } from "lucide-react";
import { getAdminUsers } from "@/lib/progress";

export default async function AdminPage() {
  const users = await getAdminUsers();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Git 기반 운영</p>
          <h1>참가자</h1>
          <p className="lede">
            <span className="mono">data/users.json</span>을 편집해 사람을 추가하세요. 풀이 파일은{" "}
            <span className="mono">submissions/&lt;githubUsername&gt;/&lt;sourceKey&gt;/&lt;submissionKey&gt;</span> 아래에
            추가한 뒤 master에 병합하면 공개 대시보드가 업데이트됩니다.
          </p>
        </div>
      </div>

      <section className="list-grid" aria-label="워크플로">
        <div className="list-card">
          <GitBranch size={18} aria-hidden="true" />
          <h3>브랜치 만들기</h3>
          <p className="panel-subtitle">각 참가자는 자신의 브랜치와 폴더에서 작업합니다.</p>
        </div>
        <div className="list-card">
          <GitMerge size={18} aria-hidden="true" />
          <h3>master에 병합</h3>
          <p className="panel-subtitle">병합된 제출물만 공식 페이지에 집계됩니다.</p>
        </div>
        <div className="list-card">
          <Users size={18} aria-hidden="true" />
          <h3>페이지 다시 빌드</h3>
          <p className="panel-subtitle">master가 변경되면 GitHub Actions가 정적 대시보드를 다시 빌드하고 배포합니다.</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>등록 사용자</h2>
            <p className="panel-subtitle">비활성 사용자는 보존되지만 대시보드 순위에서는 제외됩니다</p>
          </div>
        </div>
        {users.length === 0 ? (
          <div className="empty">등록된 사용자가 없습니다. data/users.json에 항목을 추가하세요.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>사용자</th>
                  <th>상태</th>
                  <th>폴더</th>
                  <th>제출물</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="user-cell">
                      <div className="user-name">{user.displayName}</div>
                      <span className="muted mono">@{user.githubUsername}</span>
                    </td>
                    <td>
                      <span className={`badge ${user.active ? "success" : "neutral"}`}>
                        {user.active ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td>
                      <span className="mono">{user.submissionsPath}</span>
                    </td>
                    <td className="mono">{user._count.submissions}</td>
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
