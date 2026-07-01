export const NOTIFICATION_ROLE_PATHS = {
  admin: {
    basePath: "/quan-tri",
    seeAllPath: "/quan-tri/tat-ca-thong-bao",
  },
  supplier: {
    basePath: "/nha-cung-cap",
    seeAllPath: "/nha-cung-cap/tat-ca-thong-bao",
  },
  dealer: {
    basePath: "/dai-ly",
    seeAllPath: "/dai-ly/tat-ca-thong-bao",
  },
  buyer: {
    basePath: "",
    seeAllPath: "",
  },
};

export function getNotificationSeeAllPath(role = "admin") {
  return (
    NOTIFICATION_ROLE_PATHS[role]?.seeAllPath
  );
}

export function canManageNotificationActions(role = "admin") {
  return role === "admin";
}

export function canFetchNotificationDetail(role = "admin") {
  return role === "admin";
}
