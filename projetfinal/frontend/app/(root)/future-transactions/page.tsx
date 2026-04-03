import HeaderBox from "@/components/HeaderBox";
import ScheduledTransactionsTabs from "@/components/ScheduledTransactionsTabs";


export default function FutureTransactionsPage() {
  return (
    <section className="flex h-[calc(100vh-72px)] min-h-0 w-full flex-col gap-8 overflow-y-auto px-5 py-7 sm:px-8 lg:py-12">
      <HeaderBox
        type="title"
        title="Transactions futures"
        subtext="Consultez et filtrez vos transactions programmées."
      />

      <div className="min-h-0">
        <ScheduledTransactionsTabs />
      </div>
    </section>
  );
}