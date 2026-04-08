import { describe, expect, it } from "vitest";

import { projectRoleMatrix, isAdminRole } from "@/lib/permissions/matrix";

describe("projectRoleMatrix", () => {
  it("grants full control to owners", () => {
    expect(projectRoleMatrix.owner.manageProject).toBe(true);
    expect(projectRoleMatrix.owner.manageMembers).toBe(true);
    expect(projectRoleMatrix.owner.editDocuments).toBe(true);
  });

  it("prevents readers from editing", () => {
    expect(projectRoleMatrix.reader.readDocuments).toBe(true);
    expect(projectRoleMatrix.reader.editDocuments).toBe(false);
    expect(projectRoleMatrix.reader.manageMembers).toBe(false);
  });
});

describe("isAdminRole", () => {
  it("detects admin and superadmin roles", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("superadmin")).toBe(true);
    expect(isAdminRole("user")).toBe(false);
  });
});

