"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { UserRoundCheck } from "lucide-react";
import {
  getDashboardViewerProfilePath,
  getStoredDashboardViewerId,
  saveStoredDashboardViewerId,
} from "@/lib/dashboard-viewer";

export type MyProfileUserOption = {
  id: string;
  displayName: string;
  githubUsername: string;
};

export function MyProfileSelector({ users }: { users: MyProfileUserOption[] }) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);

  useEffect(() => {
    const storedViewerId = getStoredDashboardViewerId(window.localStorage);
    const profilePath = getDashboardViewerProfilePath(users, storedViewerId);

    if (profilePath) {
      router.replace(profilePath);
      return;
    }

    if (storedViewerId) {
      saveStoredDashboardViewerId(window.localStorage, null);
    }

    setIsCheckingStorage(false);
  }, [router, users]);

  function handleUserChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextUserId = event.target.value;

    setSelectedUserId(nextUserId);

    const profilePath = getDashboardViewerProfilePath(users, nextUserId);
    if (!profilePath) {
      return;
    }

    saveStoredDashboardViewerId(window.localStorage, nextUserId);
    router.push(profilePath);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">브라우저 저장 설정</p>
          <h1>내 상태</h1>
          <p className="lede">이 브라우저에서 사용할 참가자를 선택하면 다음부터 바로 내 진행 페이지로 이동합니다.</p>
        </div>
      </div>

      <section className="panel my-profile-panel" aria-labelledby="my-profile-title">
        <div className="panel-header">
          <div>
            <h2 id="my-profile-title">사용자 선택</h2>
            <p className="panel-subtitle">로컬스토리지에 저장된 값은 이 브라우저에만 적용됩니다</p>
          </div>
          <UserRoundCheck size={18} aria-hidden="true" className="panel-icon" />
        </div>
        {users.length === 0 ? (
          <div className="empty">아직 등록된 활성 사용자가 없습니다. data/users.json에 참가자를 추가하세요.</div>
        ) : (
          <div className="my-profile-picker">
            {isCheckingStorage ? (
              <div className="muted">내 상태 설정을 확인하는 중입니다.</div>
            ) : (
              <div className="viewer-control">
                <label className="sr-only" htmlFor="my-profile-user-select">
                  내 상태 사용자 선택
                </label>
                <select id="my-profile-user-select" value={selectedUserId} onChange={handleUserChange}>
                  <option value="">사용자 선택</option>
                  {users.map((user) => (
                    <option value={user.id} key={user.id}>
                      {user.displayName} (@{user.githubUsername})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
