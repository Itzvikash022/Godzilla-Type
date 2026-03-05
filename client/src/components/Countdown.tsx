interface CountdownProps {
  count: number;
}

function Countdown({ count }: CountdownProps) {
  const isGo = count === 0;

  return (
    <div className="countdown-overlay">
      <div className="text-center">
        <div key={count} className={`countdown-number ${isGo ? 'go' : ''}`}>
          {isGo ? 'GO!' : count}
        </div>
        {!isGo && (
          <p className="text-main-sub text-sm uppercase tracking-[0.3em] mt-6 animate-pulse">
            Get ready to type...
          </p>
        )}
      </div>
    </div>
  );
}

export default Countdown;
