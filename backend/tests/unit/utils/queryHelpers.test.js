const { likeOp, escapeLike } = require("../../../src/utils/queryHelpers");
const { Op } = require("sequelize");

describe("queryHelpers", () => {
  describe("likeOp", () => {
    it("returns Op.like for the default sqlite dialect", () => {
      expect(likeOp()).toBe(Op.like);
    });

    it("returns Op.iLike for postgres dialect", () => {
      const config = require("../../../src/config");
      const original = config.database.dialect;
      config.database.dialect = "postgres";
      expect(likeOp()).toBe(Op.iLike);
      config.database.dialect = original;
    });
  });

  describe("escapeLike", () => {
    it("returns null/undefined unchanged", () => {
      expect(escapeLike(null)).toBeNull();
      expect(escapeLike(undefined)).toBeUndefined();
    });

    it("escapes percent signs", () => {
      expect(escapeLike("50%")).toBe("50\\%");
    });

    it("escapes underscores", () => {
      expect(escapeLike("a_b")).toBe("a\\_b");
    });

    it("escapes backslashes", () => {
      expect(escapeLike("a\\b")).toBe("a\\\\b");
    });

    it("escapes all wildcards in a complex string", () => {
      expect(escapeLike("100%_sure\\!")).toBe("100\\%\\_sure\\\\!");
    });

    it("leaves normal text unchanged", () => {
      expect(escapeLike("John Doe")).toBe("John Doe");
    });
  });
});
