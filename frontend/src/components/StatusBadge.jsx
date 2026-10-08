function StatusBadge({ status }) {
  const normalizedStatus = String(
    status || "UNPAID"
  ).toUpperCase();

  const isPaid = normalizedStatus === "PAID";

  return (
    <span
      className={
        isPaid
          ? "badge-rm badge-rm-paid"
          : "badge-rm badge-rm-unpaid"
      }
    >
      {normalizedStatus}
    </span>
  );
}

export default StatusBadge;