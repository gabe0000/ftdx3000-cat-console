export function canSyncRangeReadback(slider, lastWriteAt, now = Date.now()) {
  // Focus can remain after a drag; only guard an active drag and recent writes.
  return !slider.matches(":active") && now - lastWriteAt >= 250;
}
