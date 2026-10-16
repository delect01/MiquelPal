import {
  useCallback,
  useRef,
  useState
} from "react";

const DEFAULT_HISTORY_LIMIT = 100;
const NO_STATE = Symbol("NO_STATE");

function resolveNextState(
  updater,
  currentState
) {
  return typeof updater === "function"
    ? updater(currentState)
    : updater;
}

export default function useUndoRedoState(
  initialState,
  options = {}
) {
  const historyLimit =
    Number(options.historyLimit) > 0
      ? Number(options.historyLimit)
      : DEFAULT_HISTORY_LIMIT;

  const [state, setReactState] =
    useState(initialState);

  const stateRef = useRef(state);
  const pastRef = useRef([]);
  const futureRef = useRef([]);

  const transactionRef = useRef({
    active: false,
    initialState: null,
    hasChanges: false
  });

  const publishState = useCallback(
    (nextState) => {
      stateRef.current = nextState;
      setReactState(nextState);
    },
    []
  );

  const pushPastState = useCallback(
    (pastState) => {
      pastRef.current = [
        ...pastRef.current,
        pastState
      ].slice(-historyLimit);
    },
    [historyLimit]
  );

  const setState = useCallback(
    (updater, settings = {}) => {
      const currentState =
        stateRef.current;

      const nextState =
        resolveNextState(
          updater,
          currentState
        );

      if (
        Object.is(
          nextState,
          currentState
        )
      ) {
        return;
      }

      const recordHistory =
        settings.recordHistory !== false;

      if (recordHistory) {
        if (
          transactionRef.current.active
        ) {
          if (
            !transactionRef.current
              .hasChanges
          ) {
            transactionRef.current
              .initialState =
              currentState;

            transactionRef.current
              .hasChanges = true;
          }
        } else {
          pushPastState(
            currentState
          );
        }

        futureRef.current = [];
      }

      publishState(nextState);
    },
    [publishState, pushPastState]
  );

  const beginTransaction =
    useCallback(() => {
      if (
        transactionRef.current.active
      ) {
        return;
      }

      transactionRef.current = {
        active: true,
        initialState:
          stateRef.current,
        hasChanges: false
      };
    }, []);

  const endTransaction =
    useCallback(() => {
      const transaction =
        transactionRef.current;

      if (
        transaction.active &&
        transaction.hasChanges
      ) {
        pushPastState(
          transaction.initialState
        );
      }

      transactionRef.current = {
        active: false,
        initialState: null,
        hasChanges: false
      };
    }, [pushPastState]);

  const cancelTransaction =
    useCallback(() => {
      const transaction =
        transactionRef.current;

      if (
        transaction.active &&
        transaction.hasChanges
      ) {
        publishState(
          transaction.initialState
        );
      }

      transactionRef.current = {
        active: false,
        initialState: null,
        hasChanges: false
      };
    }, [publishState]);

  const undo = useCallback(() => {
    if (
      transactionRef.current.active ||
      pastRef.current.length === 0
    ) {
      return false;
    }

    const previousState =
      pastRef.current[
        pastRef.current.length - 1
      ];

    pastRef.current =
      pastRef.current.slice(0, -1);

    futureRef.current = [
      stateRef.current,
      ...futureRef.current
    ].slice(0, historyLimit);

    publishState(previousState);
    return true;
  }, [historyLimit, publishState]);

  const redo = useCallback(() => {
    if (
      transactionRef.current.active ||
      futureRef.current.length === 0
    ) {
      return false;
    }

    const nextState =
      futureRef.current[0];

    futureRef.current =
      futureRef.current.slice(1);

    pushPastState(
      stateRef.current
    );

    publishState(nextState);
    return true;
  }, [publishState, pushPastState]);

  const resetHistory = useCallback(
    (nextState = NO_STATE) => {
      pastRef.current = [];
      futureRef.current = [];

      transactionRef.current = {
        active: false,
        initialState: null,
        hasChanges: false
      };

      if (nextState !== NO_STATE) {
        publishState(nextState);
      }
    },
    [publishState]
  );

  return {
    state,
    setState,
    undo,
    redo,
    beginTransaction,
    endTransaction,
    cancelTransaction,
    resetHistory,
    canUndo:
      pastRef.current.length > 0,
    canRedo:
      futureRef.current.length > 0
  };
}
