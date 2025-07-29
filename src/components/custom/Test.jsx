import RealtimeFinanceFeed from "./finance/RealtimeFinanceFeed";

export default function Test() {
  return (
    <div>
      <RealtimeFinanceFeed ticker={"TSLA"} type={"stock"} />
    </div>
  );
}
