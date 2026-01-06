const LighthouseEffect = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: `
          radial-gradient(ellipse at 30% 50%, rgba(34, 197, 94, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(34, 197, 94, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 20%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)
        `,
        mixBlendMode: "screen",
        opacity: 0.6,
      }}
    />
  );
};

export default LighthouseEffect;

