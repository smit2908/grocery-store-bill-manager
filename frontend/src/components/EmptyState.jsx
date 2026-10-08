function EmptyState({
  icon = "bi-inbox",
  title = "No records found",
  message = "There is nothing to display.",
}) {
  return (
    <div className="rm-card text-center py-5">
      <i className={`bi ${icon} display-5 text-muted`}></i>

      <h5 className="mt-3">
        {title}
      </h5>

      <p className="text-muted mb-0">
        {message}
      </p>
    </div>
  );
}

export default EmptyState;