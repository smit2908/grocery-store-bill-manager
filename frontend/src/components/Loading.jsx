function Loading({ message = "Loading..." }) {
  return (
    <div className="rm-card text-center py-5">
      <div className="spinner-border text-brown" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>

      <p className="text-muted mt-3 mb-0">
        {message}
      </p>
    </div>
  );
}

export default Loading;
