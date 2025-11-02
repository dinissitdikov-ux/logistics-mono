// Norsk: Enkel ekko-agent for røyk-test
module.exports = {
  echo: async (input) => ({
    ok: true,
    output: input,
    confidence: 1.0,
  }),
};
