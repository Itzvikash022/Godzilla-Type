interface CountdownProps {
  count: number;
}

function Countdown({ count }: CountdownProps) {
  return (
    <div className="countdown-overlay">
      <div className="text-center">
        <div key={count} className="countdown-number">
          {count === 0 ? 'GO!' : count}
        </div>
        <p className="text-text-secondary text-lg mt-4">
          Get ready to type...
        </p>
      </div>
    </div>
  );
}

export default Countdown;
