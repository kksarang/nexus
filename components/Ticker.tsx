const words = ["PS5 stations", "Car simulator", "Private room", "Panoor", "Thalassery", "Kannur", "Play", "Connect", "Level up"];

export function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {[...words, ...words, ...words, ...words].map((word, index) => (
          <span key={index} className="ticker-word">{word}</span>
        ))}
      </div>
    </div>
  );
}
