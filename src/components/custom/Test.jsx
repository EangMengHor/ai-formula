import RealtimeFinanceFeed from "./finance/RealtimeFinanceFeed";

export default function Test() {
  return (
    <div>
      <RealtimeFinanceFeed ticker={"X:BTCUSD"} type={"crypto"} />
    </div>
  );
}
