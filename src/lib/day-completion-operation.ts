const DAY_COMPLETION_OPERATION_PREFIX = "day-completion:";
const VALID_OPERATION_ID = /^[A-Za-z0-9._:-]{1,100}$/;

// This is command identity, not a credential. Authorization still binds the
// authenticated athlete to the immutable day before the operation is used.
export function dayCompletionOperationId(dayId: string) {
  const operationId = `${DAY_COMPLETION_OPERATION_PREFIX}${dayId}`;
  if (!VALID_OPERATION_ID.test(operationId)) {
    throw new Error("Identificador de día inválido para completar la sesión.");
  }
  return operationId;
}
