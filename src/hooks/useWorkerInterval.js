import { useEffect, useRef } from 'react';

const useWorkerInterval = (callback, delay) => {
  const savedCallback = useRef(callback);
  const workerRef = useRef(null);

  // Remember the latest callback if it changes.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the worker and interval.
  useEffect(() => {
    // If delay is null, we do not start the worker interval
    if (delay !== null) {
      const code = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data.type === 'start') {
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
              self.postMessage('tick');
            }, e.data.delay);
          } else if (e.data.type === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;
      const blob = new Blob([code], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      workerRef.current = worker;

      worker.onmessage = () => {
        if (savedCallback.current) {
          savedCallback.current();
        }
      };

      worker.postMessage({ type: 'start', delay });

      return () => {
        worker.postMessage({ type: 'stop' });
        worker.terminate();
      };
    }
  }, [delay]);
};

export default useWorkerInterval;
