export class ExperienceUtils {
  static calculateExperienceDifference(level: number): number {
    if (level < 2) {
      throw new Error("Level must be 2 or higher.");
    }
    const exponentPart: number = Math.pow(2, (level - 1) / 7);
    const expressionValue: number = level - 1 + 300 * exponentPart;
    const result: number = (1.0 / 4) * expressionValue;
    const flooredValue: number = Math.floor(result);

    return flooredValue;
  }

  static getLevelFromExperience(experience: number): number {
    let level: number = 1;
    let accumulatedExperience: number = 0;

    while (true) {
      const experienceDifference: number = this.calculateExperienceDifference(
        level + 1
      );
      if (accumulatedExperience + experienceDifference > experience) {
        break;
      }
      accumulatedExperience += experienceDifference;
      level++;
    }

    return level;
  }

  static getExperienceUntilNextLevel(experience: number): number {
    const currentLevel: number = this.getLevelFromExperience(experience);
    const experienceDifference: number = this.calculateExperienceDifference(
      currentLevel + 1
    );
    const experienceUntilNextLevel: number =
      experienceDifference -
      (experience - this.calculateExperienceDifference(currentLevel));

    return experienceUntilNextLevel;
  }
}
