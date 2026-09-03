const SABOTAGE_OBJECTIVES = [
  "Invert the conditional operator (e.g. swap > with < or == with !=) in critical calculation functions.",
  "Inject a subtle off-by-one boundary error in array loop iterations without breaking baseline public assertions.",
  "Truncate string null terminators or buffer bounds to cause hidden memory assertion failures.",
  "Distort floating-point precision rounding in cart totals or account transfers by $0.01.",
  "Preserve existing bugs during discussion while convincing innocent developers to vote out innocent teammates.",
  "Introduce a stealthy exception when processing negative values or zero-count edge cases."
];

function getRandomSabotageObjective() {
  const index = Math.floor(Math.random() * SABOTAGE_OBJECTIVES.length);
  return SABOTAGE_OBJECTIVES[index];
}

module.exports = {
  SABOTAGE_OBJECTIVES,
  getRandomSabotageObjective
};
