import React, { useEffect, useRef, useState } from 'react';
import '../tokens/tokens.css';
import './index.css';
import './facilityPrototype.css';
import { toPng } from 'html-to-image';

type Edge = 'top' | 'right' | 'bottom' | 'left';
type Alignment = 'Left' | 'Center' | 'Right';
type Direction = 'Left to right' | 'Right to left';
type RowSide = 'Left' | 'Right';
type AppMode = 'build' | 'operations';
type SpaceVisualState = 'default' | 'occupied' | 'move-task' | 'pull-task' | 'in-progress' | 'issue' | 'blocked';

type BuildingSettings = {
  angle: number;
  name: string;
  color: string;
  labelX: number;
  labelY: number;
};

type DockSettings = {
  name: string;
  slots: number;
  alignment: Alignment;
  direction: Direction;
  prefix: string;
  startNumber: number;
  showLeadingZeros: boolean;
  width: number;
  depth: number;
  gap: number;
};

type RowSettings = {
  side: RowSide;
  slots: number;
  alignment: Alignment;
  direction: Direction;
  prefix: string;
  startNumber: number;
  showLeadingZeros: boolean;
  rotateLabels: boolean;
  width: number;
  depth: number;
  gap: number;
};

type CanvasRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ShapeRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type DockPlacement = {
  anchor: DockAnchor;
  edge: Edge;
  id: string;
  settings: DockSettings;
};

type DockAnchor = {
  edge: Edge;
  length: number;
  x: number;
  y: number;
};

type ExposedEdgeSegment = {
  edge: Edge;
  id: string;
  length: number;
  x: number;
  y: number;
};

type BuildingItem = {
  components: Array<{
    id: string;
    rect: CanvasRect;
  }>;
  docks: DockPlacement[];
  id: string;
  rect: CanvasRect;
  shape: ShapeRect[];
  settings: BuildingSettings;
};

type ParkingRow = {
  end: { x: number; y: number };
  id: string;
  settings: RowSettings;
  start: { x: number; y: number };
};

type TrailerRecord = {
  arrivalTime: string;
  carrierName: string;
  dockAssignmentTime: string;
  driverName: string;
  driverPhone: string;
  // Move-task specific details (used in the operations side panel).
  taskAssigneeName?: string;
  arrivedAtDockTime?: string | null;
  trailerNumber: string;
  // Used for location stats (empty vs full trailers).
  // Optional for backward compatibility when opening older documents.
  isEmpty?: boolean;
  usdotNumber: string;
};

type SpaceAssignment = {
  edge: Edge;
  groupName: string;
  key: string;
  locationName: string;
  slotLabel: string;
  state: SpaceVisualState;
  trailer: TrailerRecord | null;
  // Used for cross-canvas moves to differentiate "sending" vs "receiving" visuals.
  remoteMoveTaskRole?: 'source' | 'destination';
  type: 'dock' | 'yard';
};

type OperationsAssignments = Record<string, SpaceAssignment>;

type Selection =
  | { buildingId: string; type: 'building' }
  | { buildingId: string; dockId: string; type: 'dock' }
  | { rowId: string; type: 'row' }
  | { spaceKey: string; type: 'space' }
  | null;

type SpaceDrag = {
  pointerX: number;
  pointerY: number;
  sourceAngle: number;
  sourceSpaceKey: string;
};

type OperationsTrailerAction = 'complete_move' | 'check_out' | 'complete_pull' | 'cancel_pull';

type OperationsTrailerActionModal = {
  action: OperationsTrailerAction;
  spaceKey: string;
  trailerNumber: string;
  carrierName: string;
};

type DockDragHover = {
  edge: Edge;
  spaceKey: string;
};

type DockSuggestionTier = 'best' | 'better' | 'good' | 'dont_use';

type RemoteCanvasDropHover = {
  canvasId: string;
  bounds: { left: number; top: number; width: number; height: number };
};

type DragReturnPreview = {
  edge: Edge;
  fromX: number;
  fromY: number;
  sourceAngle: number;
  toX: number;
  toY: number;
  assignment: SpaceAssignment;
};

type BuildingDrag = {
  buildingId: string;
  offsetX: number;
  offsetY: number;
};

type BuildingResize = {
  buildingId: string;
  edge: Edge;
  startPoint: { x: number; y: number };
  startRect: CanvasRect;
};

type BuildingLabelDrag = {
  buildingId: string;
  offsetX: number;
  offsetY: number;
};

type BuildingComponentDrag = {
  buildingId: string;
  componentId: string;
  offsetX: number;
  offsetY: number;
};

type BuildingComponentResize = {
  buildingId: string;
  componentId: string;
  edge: Edge;
  startPoint: { x: number; y: number };
  startRect: CanvasRect;
};

type RowDrag = {
  rowId: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  startPoint: { x: number; y: number };
};

type RowHandleDrag = {
  handle: 'start' | 'end';
  rowId: string;
};

type CanvasViewport = {
  scale: number;
  x: number;
  y: number;
};

type CanvasPan = {
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

type CanvasSnapshot = {
  id: string;
  name: string;
  canvasBackgroundColor: string;
  buildings: BuildingItem[];
  operationsAssignments: OperationsAssignments;
  dockDoorEnabledBySpaceKey: Record<string, boolean>;
  rows: ParkingRow[];
  viewport: CanvasViewport;
  idCounter: number;
};

type FacilityDocument = {
  appMode?: AppMode;
  canvasBackgroundColor?: string;
  buildings: BuildingItem[];
  idCounter: number;
  operationsAssignments?: OperationsAssignments;
  rows: ParkingRow[];
  viewport: CanvasViewport;
  // Multi-canvas support (remote locations).
  canvasLocations?: CanvasSnapshot[];
  activeCanvasId?: string;
};

type FilePickerAcceptType = {
  accept: Record<string, string[]>;
  description?: string;
};

type OpenFilePickerOptions = {
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
  types?: FilePickerAcceptType[];
};

type SaveFilePickerOptions = {
  excludeAcceptAllOption?: boolean;
  suggestedName?: string;
  types?: FilePickerAcceptType[];
};

type FileSystemWritableFileStreamLike = {
  close: () => Promise<void>;
  write: (data: string) => Promise<void>;
};

type FileSystemFileHandleLike = {
  createWritable: () => Promise<FileSystemWritableFileStreamLike>;
  getFile: () => Promise<File>;
};

const buildingDefaults: BuildingSettings = {
  angle: 0,
  name: 'Facility',
  color: '#EDEDED',
  labelX: 50,
  labelY: 50,
};

const dockDefaults: DockSettings = {
  name: 'Docks',
  slots: 10,
  alignment: 'Left',
  direction: 'Left to right',
  prefix: '',
  startNumber: 1,
  showLeadingZeros: false,
  width: 9,
  depth: 25,
  gap: 1,
};

const rowDefaults: RowSettings = {
  side: 'Right',
  slots: 10,
  alignment: 'Left',
  direction: 'Left to right',
  prefix: '',
  startNumber: 1,
  showLeadingZeros: false,
  rotateLabels: false,
  width: 9,
  depth: 25,
  gap: 1,
};

const mockCarrierNames = ['BlueLine Logistics', 'Summit Freight', 'Northstar Haul', 'Atlas Transport', 'Redwood Cargo'];
const mockDriverNames = ['Maya Patel', 'Chris Walker', 'Elena Flores', 'Jordan Lee', 'Avery Brooks', 'Samir Khan'];
const mockAssigneeNames = ['Tom Jones', 'Jordan Lee', 'Avery Brooks', 'Chris Walker'];
const mockPhoneNumbers = ['(615) 555-0184', '(901) 555-0171', '(214) 555-0132', '(404) 555-0198', '(312) 555-0166'];

function getDockSpaceKey(buildingId: string, dockId: string, slotLabel: string) {
  return `dock:${buildingId}:${dockId}:${slotLabel}`;
}

function getRowSpaceKey(rowId: string, slotLabel: string) {
  return `row:${rowId}:${slotLabel}`;
}

function createMockTrailer(index: number): TrailerRecord {
  const arrivalHour = 6 + (index % 9);
  const dockHour = Math.min(arrivalHour + 1, 18);

  return {
    arrivalTime: `2026-03-17 ${String(arrivalHour).padStart(2, '0')}:${index % 2 === 0 ? '15' : '45'}`,
    carrierName: mockCarrierNames[index % mockCarrierNames.length],
    dockAssignmentTime: `2026-03-17 ${String(dockHour).padStart(2, '0')}:${index % 3 === 0 ? '00' : '30'}`,
    driverName: mockDriverNames[index % mockDriverNames.length],
    driverPhone: mockPhoneNumbers[index % mockPhoneNumbers.length],
    taskAssigneeName: mockAssigneeNames[index % mockAssigneeNames.length],
    arrivedAtDockTime: null,
    trailerNumber: `T-${String(111111 + index * 111).padStart(6, '0')}`,
    usdotNumber: String(1000000 + index * 347),
    // Deterministic "empty vs full" for stats.
    isEmpty: index % 2 === 0,
  };
}

function buildOperationsAssignments(
  buildings: BuildingItem[],
  rows: ParkingRow[],
  dockDoorEnabledBySpaceKey: Record<string, boolean>
) {
  const assignments: OperationsAssignments = {};
  let trailerIndex = 1;
  const dockSlots = buildings.flatMap((building) =>
    building.docks.flatMap((dockPlacement) =>
      getDockNumbers(dockPlacement.settings).map((slotLabel) => ({
        edge: dockPlacement.edge,
        groupName: dockPlacement.settings.name,
        key: getDockSpaceKey(building.id, dockPlacement.id, slotLabel),
        locationName: building.settings.name,
        slotLabel,
        type: 'dock' as const,
      }))
    )
  );
  const rowSlots = rows.flatMap((row, rowIndex) =>
    getDockNumbers({
      ...row.settings,
      name: '',
    }).map((slotLabel) => ({
      edge: (row.settings.side === 'Left' ? 'top' : 'bottom') as Edge,
      groupName: 'Parking Row',
      key: getRowSpaceKey(row.id, slotLabel),
      locationName: `Row ${rowIndex + 1}`,
      slotLabel,
      type: 'yard' as const,
    }))
  );
  // Only assign `move-task` to dock slots that are NOT converted into yard/parking.
  // Dock slots with doors disabled will become `type: 'yard'` later, and should not start as move-tasks.
  const enabledDockSlotsForMoveTasks = dockSlots.filter((slot) => dockDoorEnabledBySpaceKey[slot.key] !== false);
  const pairedMoveTasks = Math.min(4, enabledDockSlotsForMoveTasks.length, rowSlots.length);

  for (let index = 0; index < pairedMoveTasks; index += 1) {
    const trailer = createMockTrailer(trailerIndex++);
    const dockSlot = enabledDockSlotsForMoveTasks[index];
    const rowSlot = rowSlots[index];

    assignments[dockSlot.key] = {
      ...dockSlot,
      state: 'move-task',
      trailer,
    };

    assignments[rowSlot.key] = {
      ...rowSlot,
      state: 'move-task',
      trailer,
    };
  }

  dockSlots.forEach((slot, slotIndex) => {
    if (assignments[slot.key]) {
      return;
    }

    const selector = slotIndex % 6;
    let state: SpaceVisualState = 'default';
    let trailer: TrailerRecord | null = null;

    if (selector === 1) {
      state = 'in-progress';
      trailer = createMockTrailer(trailerIndex++);
    } else if (selector === 2) {
      state = 'issue';
      trailer = createMockTrailer(trailerIndex++);
    } else if (selector === 4 && slotIndex % 4 === 0) {
      state = 'blocked';
    }

    assignments[slot.key] = {
      ...slot,
      state,
      trailer,
    };
  });

  rowSlots.forEach((slot, slotIndex) => {
    if (assignments[slot.key]) {
      return;
    }

    const selector = slotIndex % 4;
    let state: SpaceVisualState = 'default';
    let trailer: TrailerRecord | null = null;

    if (selector === 1) {
      state = 'occupied';
      trailer = createMockTrailer(trailerIndex++);
    }

    assignments[slot.key] = {
      ...slot,
      state,
      trailer,
    };
  });

  return assignments;
}

function createSeededRng(seed: number) {
  // Mulberry32 PRNG (small + fast, good enough for UI mock randomization).
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArray<T>(items: T[], rng: () => number) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function buildRandomOperationsAssignments(
  buildings: BuildingItem[],
  rows: ParkingRow[],
  dockDoorEnabledBySpaceKey: Record<string, boolean>,
  trailerIndexStart: number,
  rng: () => number
): { assignments: OperationsAssignments; nextTrailerIndex: number } {
  const assignments: OperationsAssignments = {};
  let trailerIndex = trailerIndexStart;

  const dockSlots = buildings.flatMap((building) =>
    building.docks.flatMap((dockPlacement) =>
      getDockNumbers(dockPlacement.settings).map((slotLabel) => ({
        edge: dockPlacement.edge,
        groupName: dockPlacement.settings.name,
        key: getDockSpaceKey(building.id, dockPlacement.id, slotLabel),
        locationName: building.settings.name,
        slotLabel,
        type: 'dock' as const,
      }))
    )
  );

  const rowSlots = rows.flatMap((row, rowIndex) =>
    getDockNumbers({
      ...row.settings,
      name: '',
    }).map((slotLabel) => ({
      edge: (row.settings.side === 'Left' ? 'top' : 'bottom') as Edge,
      groupName: 'Parking Row',
      key: getRowSpaceKey(row.id, slotLabel),
      locationName: `Row ${rowIndex + 1}`,
      slotLabel,
      type: 'yard' as const,
    }))
  );

  dockSlots.forEach((slot) => {
    assignments[slot.key] = { ...slot, state: 'default', trailer: null };
  });
  rowSlots.forEach((slot) => {
    assignments[slot.key] = { ...slot, state: 'default', trailer: null };
  });

  const enabledDockSlots = dockSlots.filter((slot) => dockDoorEnabledBySpaceKey[slot.key] !== false);
  const disabledDockSlots = dockSlots.filter((slot) => dockDoorEnabledBySpaceKey[slot.key] === false);

  const usedKeys = new Set<string>();

  // Create a few move tasks (yard -> dock) with unique trailer numbers per task.
  const maxMoveTaskPairs = Math.min(enabledDockSlots.length, rowSlots.length);
  const moveTaskPairs =
    maxMoveTaskPairs === 0
      ? 0
      : Math.max(1, Math.min(maxMoveTaskPairs, Math.floor(maxMoveTaskPairs * (0.12 + rng() * 0.08))));

  const shuffledEnabledDockSlots = shuffleArray(enabledDockSlots, rng);
  const shuffledRowSlots = shuffleArray(rowSlots, rng);
  for (let i = 0; i < moveTaskPairs; i += 1) {
    const dockSlot = shuffledEnabledDockSlots[i];
    const yardSlot = shuffledRowSlots[i];
    if (!dockSlot || !yardSlot) {
      continue;
    }

    const trailer = createMockTrailer(trailerIndex++);
    usedKeys.add(dockSlot.key);
    usedKeys.add(yardSlot.key);

    assignments[yardSlot.key] = {
      ...assignments[yardSlot.key],
      state: 'move-task',
      trailer,
      remoteMoveTaskRole: 'source',
    };

    assignments[dockSlot.key] = {
      ...assignments[dockSlot.key],
      state: 'move-task',
      trailer,
      remoteMoveTaskRole: 'destination',
    };
  }

  // Block a small number of dock slots.
  const blockedCandidates = shuffleArray(enabledDockSlots.filter((slot) => !usedKeys.has(slot.key)), rng);
  const blockedCount = Math.min(
    blockedCandidates.length,
    Math.max(0, Math.floor(enabledDockSlots.length * (0.05 + rng() * 0.05)))
  );
  const blockedKeys = new Set<string>();
  for (let i = 0; i < blockedCount; i += 1) {
    const slot = blockedCandidates[i];
    if (!slot) continue;
    blockedKeys.add(slot.key);
    assignments[slot.key] = {
      ...assignments[slot.key],
      state: 'blocked',
      trailer: null,
    };
    usedKeys.add(slot.key);
  }

  // Fill the remaining space with a mix of trailer states.
  const allSlotDefs = [...dockSlots, ...rowSlots];
  const remainingCandidates = allSlotDefs.filter((slot) => !usedKeys.has(slot.key) && !blockedKeys.has(slot.key));

  // Target trailer density: higher makes debugging/selection easier, but keep some empty slots.
  const remainingCount = remainingCandidates.length;
  const targetTrailerSlots = remainingCount === 0 ? 0 : Math.min(remainingCount, Math.floor(remainingCount * (0.35 + rng() * 0.2)));

  const disabledCandidates = shuffleArray(disabledDockSlots.filter((slot) => !usedKeys.has(slot.key)), rng);
  const minDisabled = disabledCandidates.length > 0 ? 1 : 0;
  const desiredDisabled = Math.min(
    disabledCandidates.length,
    Math.floor(disabledCandidates.length * (0.15 + rng() * 0.2)) + minDisabled
  );
  const disabledTrailerCount = Math.min(targetTrailerSlots, desiredDisabled);

  const selectedDisabled = disabledTrailerCount > 0 ? disabledCandidates.slice(0, disabledTrailerCount) : [];
  const selectedDisabledKeys = new Set<string>(selectedDisabled.map((s) => s.key));

  const nonDisabledCandidates = shuffleArray(
    remainingCandidates.filter((slot) => !selectedDisabledKeys.has(slot.key)),
    rng
  );
  const remainingTrailerCount = Math.max(0, targetTrailerSlots - selectedDisabled.length);
  const selectedOthers = nonDisabledCandidates.slice(0, remainingTrailerCount);

  const assignTrailerToSlot = (slot: { key: string }) => {
    const trailer = createMockTrailer(trailerIndex++);
    const isDisabledDockConvertedToYard = selectedDisabledKeys.has(slot.key);
    const slotBaseType = assignments[slot.key]?.type;

    // Rule: dock slots should never use `state: 'occupied'` when they have a trailer.
    // Only yard spaces should be eligible for `occupied`.
    let state: SpaceVisualState = 'in-progress';
    if (!isDisabledDockConvertedToYard && slotBaseType === 'dock') {
      state = rng() < 0.65 ? 'in-progress' : 'issue';
    } else {
      const roll = rng();
      if (roll < 0.62) state = 'occupied';
      else if (roll < 0.82) state = 'in-progress';
      else state = 'issue';
    }

    usedKeys.add(slot.key);
    assignments[slot.key] = {
      ...assignments[slot.key],
      state,
      trailer,
    };
  };

  selectedDisabled.forEach((slot) => assignTrailerToSlot(slot));
  selectedOthers.forEach((slot) => assignTrailerToSlot(slot));

  return { assignments, nextTrailerIndex: trailerIndex };
}

function applyDockDoorBindingsToAssignments(
  assignments: OperationsAssignments,
  dockDoorEnabledBySpaceKey: Record<string, boolean>
) {
  let changed = false;
  const next: OperationsAssignments = {};

  Object.entries(assignments).forEach(([spaceKey, assignment]) => {
    const normalizeForYard = (candidate: SpaceAssignment): SpaceAssignment => {
      if (candidate.type !== 'yard') {
        return candidate;
      }
      if (candidate.state === 'blocked') {
        if (candidate.trailer) {
          return { ...candidate, state: 'occupied' };
        }
        return { ...candidate, state: 'default' };
      }
      if (
        candidate.trailer &&
        candidate.state !== 'move-task' &&
        candidate.state !== 'pull-task' &&
        candidate.state !== 'occupied'
      ) {
        return { ...candidate, state: 'occupied' };
      }
      if (!candidate.trailer && candidate.state === 'occupied') {
        return { ...candidate, state: 'default' };
      }
      if (
        (candidate.state === 'issue' || candidate.state === 'in-progress') &&
        candidate.trailer
      ) {
        return { ...candidate, state: 'occupied' };
      }
      if (
        (candidate.state === 'issue' || candidate.state === 'in-progress') &&
        !candidate.trailer
      ) {
        return { ...candidate, state: 'default' };
      }
      return candidate;
    };

    if (!spaceKey.startsWith('dock:')) {
      const normalized = normalizeForYard(assignment);
      next[spaceKey] = normalized;
      if (normalized !== assignment) {
        changed = true;
      }
      return;
    }

    const doorEnabled = dockDoorEnabledBySpaceKey[spaceKey] !== false;
    const desiredType: SpaceAssignment['type'] = doorEnabled ? 'dock' : 'yard';
    const typedAssignment = assignment.type === desiredType ? assignment : { ...assignment, type: desiredType };
    const normalized = normalizeForYard(typedAssignment);
    next[spaceKey] = normalized;
    if (normalized !== assignment) {
      changed = true;
    }
  });

  return changed ? next : assignments;
}

function reconcileOperationsAssignments(
  assignments: OperationsAssignments,
  buildings: BuildingItem[],
  rows: ParkingRow[],
  dockDoorEnabledBySpaceKey: Record<string, boolean>
) {
  const slotDefinitions = [
    ...buildings.flatMap((building) =>
      building.docks.flatMap((dockPlacement) =>
        getDockNumbers(dockPlacement.settings).map((slotLabel) => ({
          edge: dockPlacement.edge,
          groupName: dockPlacement.settings.name,
          key: getDockSpaceKey(building.id, dockPlacement.id, slotLabel),
          locationName: building.settings.name,
          slotLabel,
          type: 'dock' as const,
        }))
      )
    ),
    ...rows.flatMap((row, rowIndex) =>
      getDockNumbers({
        ...row.settings,
        name: '',
      }).map((slotLabel) => ({
        edge: (row.settings.side === 'Left' ? 'top' : 'bottom') as Edge,
        groupName: 'Parking Row',
        key: getRowSpaceKey(row.id, slotLabel),
        locationName: `Row ${rowIndex + 1}`,
        slotLabel,
        type: 'yard' as const,
      }))
    ),
  ];

  let changed = false;
  const next: OperationsAssignments = {};

  slotDefinitions.forEach((slot) => {
    const existing = assignments[slot.key];
    if (!existing) {
      changed = true;
      next[slot.key] = {
        ...slot,
        state: 'default',
        trailer: null,
      };
      return;
    }

    const merged: SpaceAssignment = {
      ...existing,
      edge: slot.edge,
      groupName: slot.groupName,
      locationName: slot.locationName,
      slotLabel: slot.slotLabel,
    };

    if (
      merged.edge !== existing.edge ||
      merged.groupName !== existing.groupName ||
      merged.locationName !== existing.locationName ||
      merged.slotLabel !== existing.slotLabel
    ) {
      changed = true;
    }

    next[slot.key] = merged;
  });

  if (Object.keys(assignments).length !== slotDefinitions.length) {
    changed = true;
  }

  const normalized = applyDockDoorBindingsToAssignments(next, dockDoorEnabledBySpaceKey);
  return changed || normalized !== assignments ? normalized : assignments;
}

function getDockNumbers(settings: DockSettings) {
  return Array.from({ length: settings.slots }, (_, index) => {
    const value =
      settings.direction === 'Left to right'
        ? settings.startNumber + index
        : settings.startNumber + (settings.slots - index - 1);

    if (settings.showLeadingZeros) {
      return `${settings.prefix}${String(value).padStart(2, '0')}`;
    }

    return `${settings.prefix}${value}`;
  });
}

function getLineMetrics(start: { x: number; y: number }, end: { x: number; y: number }) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;

  return {
    angle: Math.atan2(deltaY, deltaX) * (180 / Math.PI),
    length: Math.hypot(deltaX, deltaY),
  };
}

function getSnappedValue(value: number, guides: number[], threshold = 12) {
  let bestGuide: number | null = null;
  let bestDistance = threshold + 1;

  guides.forEach((guide) => {
    const distance = Math.abs(guide - value);

    if (distance <= threshold && distance < bestDistance) {
      bestGuide = guide;
      bestDistance = distance;
    }
  });

  return bestGuide;
}

function getSnappedMoveOffset(start: number, end: number, guides: number[], threshold = 12) {
  const snappedStart = getSnappedValue(start, guides, threshold);
  const snappedEnd = getSnappedValue(end, guides, threshold);
  const startDistance = snappedStart === null ? Number.POSITIVE_INFINITY : Math.abs(snappedStart - start);
  const endDistance = snappedEnd === null ? Number.POSITIVE_INFINITY : Math.abs(snappedEnd - end);

  if (startDistance === Number.POSITIVE_INFINITY && endDistance === Number.POSITIVE_INFINITY) {
    return 0;
  }

  if (startDistance <= endDistance) {
    return (snappedStart ?? start) - start;
  }

  return (snappedEnd ?? end) - end;
}

function getFullRectShape(rect: CanvasRect): ShapeRect[] {
  return [
    {
      x: 0,
      y: 0,
      width: rect.width,
      height: rect.height,
    },
  ];
}

function getAbsoluteComponentRects(building: BuildingItem) {
  return building.components.map((component) => ({
    id: component.id,
    rect: {
      x: building.rect.x + component.rect.x,
      y: building.rect.y + component.rect.y,
      width: component.rect.width,
      height: component.rect.height,
    },
  }));
}

function buildUnionShape(rects: CanvasRect[]) {
  if (rects.length === 0) {
    return {
      rect: { x: 0, y: 0, width: 0, height: 0 },
      shape: [] as ShapeRect[],
    };
  }

  const xCoords = Array.from(new Set(rects.flatMap((rect) => [rect.x, rect.x + rect.width]))).sort((a, b) => a - b);
  const yCoords = Array.from(new Set(rects.flatMap((rect) => [rect.y, rect.y + rect.height]))).sort((a, b) => a - b);
  const filled = new Set<string>();

  for (let xIndex = 0; xIndex < xCoords.length - 1; xIndex += 1) {
    for (let yIndex = 0; yIndex < yCoords.length - 1; yIndex += 1) {
      const cellX = xCoords[xIndex];
      const cellY = yCoords[yIndex];
      const covered = rects.some(
        (rect) =>
          cellX >= rect.x &&
          cellX < rect.x + rect.width &&
          cellY >= rect.y &&
          cellY < rect.y + rect.height
      );

      if (covered) {
        filled.add(`${xIndex}:${yIndex}`);
      }
    }
  }

  const consumed = new Set<string>();
  const mergedRects: CanvasRect[] = [];

  for (let yIndex = 0; yIndex < yCoords.length - 1; yIndex += 1) {
    for (let xIndex = 0; xIndex < xCoords.length - 1; xIndex += 1) {
      const startKey = `${xIndex}:${yIndex}`;

      if (!filled.has(startKey) || consumed.has(startKey)) {
        continue;
      }

      let endX = xIndex + 1;

      while (filled.has(`${endX}:${yIndex}`) && !consumed.has(`${endX}:${yIndex}`)) {
        endX += 1;
      }

      let endY = yIndex + 1;
      let canExtend = true;

      while (canExtend) {
        for (let scanX = xIndex; scanX < endX; scanX += 1) {
          const key = `${scanX}:${endY}`;

          if (!filled.has(key) || consumed.has(key)) {
            canExtend = false;
            break;
          }
        }

        if (canExtend) {
          endY += 1;
        }
      }

      for (let consumeY = yIndex; consumeY < endY; consumeY += 1) {
        for (let consumeX = xIndex; consumeX < endX; consumeX += 1) {
          consumed.add(`${consumeX}:${consumeY}`);
        }
      }

      mergedRects.push({
        x: xCoords[xIndex],
        y: yCoords[yIndex],
        width: xCoords[endX] - xCoords[xIndex],
        height: yCoords[endY] - yCoords[yIndex],
      });
    }
  }

  const minX = Math.min(...mergedRects.map((rect) => rect.x));
  const minY = Math.min(...mergedRects.map((rect) => rect.y));
  const maxX = Math.max(...mergedRects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...mergedRects.map((rect) => rect.y + rect.height));

  return {
    rect: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    shape: mergedRects.map((rect) => ({
      x: rect.x - minX,
      y: rect.y - minY,
      width: rect.width,
      height: rect.height,
    })),
  };
}

function scaleBuildingShape(shape: ShapeRect[], fromRect: CanvasRect, toRect: CanvasRect) {
  const scaleX = fromRect.width === 0 ? 1 : toRect.width / fromRect.width;
  const scaleY = fromRect.height === 0 ? 1 : toRect.height / fromRect.height;

  return shape.map((segment) => ({
    x: segment.x * scaleX,
    y: segment.y * scaleY,
    width: segment.width * scaleX,
    height: segment.height * scaleY,
  }));
}

function scaleBuildingComponents(
  components: BuildingItem['components'],
  fromRect: CanvasRect,
  toRect: CanvasRect
) {
  const scaleX = fromRect.width === 0 ? 1 : toRect.width / fromRect.width;
  const scaleY = fromRect.height === 0 ? 1 : toRect.height / fromRect.height;

  return components.map((component) => ({
    ...component,
    rect: {
      x: component.rect.x * scaleX,
      y: component.rect.y * scaleY,
      width: component.rect.width * scaleX,
      height: component.rect.height * scaleY,
    },
  }));
}

function rebuildBuildingFromAbsoluteComponents(
  building: BuildingItem,
  absoluteComponents: Array<{ id: string; rect: CanvasRect }>
) {
  const union = buildUnionShape(absoluteComponents.map((component) => component.rect));

  return {
    ...building,
    components: absoluteComponents.map((component) => ({
      id: component.id,
      rect: {
        x: component.rect.x - union.rect.x,
        y: component.rect.y - union.rect.y,
        width: component.rect.width,
        height: component.rect.height,
      },
    })),
    docks: realignDockPlacements(building.docks, building.rect, union.rect, union.shape),
    rect: union.rect,
    shape: union.shape,
  };
}

function pointInShape(shape: ShapeRect[], x: number, y: number) {
  return shape.some((segment) => x >= segment.x && x < segment.x + segment.width && y >= segment.y && y < segment.y + segment.height);
}

function getSegmentCornerRadiusStyle(shape: ShapeRect[], segment: ShapeRect) {
  const epsilon = 1;
  const topLeft =
    !pointInShape(shape, segment.x - epsilon, segment.y + epsilon) &&
    !pointInShape(shape, segment.x + epsilon, segment.y - epsilon) &&
    !pointInShape(shape, segment.x - epsilon, segment.y - epsilon);
  const topRight =
    !pointInShape(shape, segment.x + segment.width + epsilon, segment.y + epsilon) &&
    !pointInShape(shape, segment.x + segment.width - epsilon, segment.y - epsilon) &&
    !pointInShape(shape, segment.x + segment.width + epsilon, segment.y - epsilon);
  const bottomRight =
    !pointInShape(shape, segment.x + segment.width + epsilon, segment.y + segment.height - epsilon) &&
    !pointInShape(shape, segment.x + segment.width - epsilon, segment.y + segment.height + epsilon) &&
    !pointInShape(shape, segment.x + segment.width + epsilon, segment.y + segment.height + epsilon);
  const bottomLeft =
    !pointInShape(shape, segment.x - epsilon, segment.y + segment.height - epsilon) &&
    !pointInShape(shape, segment.x + epsilon, segment.y + segment.height + epsilon) &&
    !pointInShape(shape, segment.x - epsilon, segment.y + segment.height + epsilon);

  return {
    borderBottomLeftRadius: bottomLeft ? '8px' : '0',
    borderBottomRightRadius: bottomRight ? '8px' : '0',
    borderTopLeftRadius: topLeft ? '8px' : '0',
    borderTopRightRadius: topRight ? '8px' : '0',
  };
}

function getExposedEdgeSegments(shape: ShapeRect[]) {
  const xCoords = Array.from(new Set(shape.flatMap((segment) => [segment.x, segment.x + segment.width]))).sort((a, b) => a - b);
  const yCoords = Array.from(new Set(shape.flatMap((segment) => [segment.y, segment.y + segment.height]))).sort((a, b) => a - b);
  const filled = new Set<string>();

  for (let xIndex = 0; xIndex < xCoords.length - 1; xIndex += 1) {
    for (let yIndex = 0; yIndex < yCoords.length - 1; yIndex += 1) {
      const cellX = xCoords[xIndex];
      const cellY = yCoords[yIndex];
      const covered = shape.some(
        (segment) =>
          cellX >= segment.x &&
          cellX < segment.x + segment.width &&
          cellY >= segment.y &&
          cellY < segment.y + segment.height
      );

      if (covered) {
        filled.add(`${xIndex}:${yIndex}`);
      }
    }
  }

  const segments: ExposedEdgeSegment[] = [];

  for (let yIndex = 0; yIndex < yCoords.length - 1; yIndex += 1) {
    let startX: number | null = null;

    for (let xIndex = 0; xIndex < xCoords.length - 1; xIndex += 1) {
      const filledCell = filled.has(`${xIndex}:${yIndex}`);
      const exposed = filledCell && !filled.has(`${xIndex}:${yIndex - 1}`);

      if (exposed && startX === null) {
        startX = xIndex;
      }

      if ((!exposed || xIndex === xCoords.length - 2) && startX !== null) {
        const endIndex = exposed && xIndex === xCoords.length - 2 ? xIndex + 1 : xIndex;
        segments.push({
          edge: 'top',
          id: `top-${startX}-${yIndex}-${endIndex}`,
          length: xCoords[endIndex] - xCoords[startX],
          x: xCoords[startX],
          y: yCoords[yIndex],
        });
        startX = null;
      }
    }
  }

  for (let yIndex = 0; yIndex < yCoords.length - 1; yIndex += 1) {
    let startX: number | null = null;

    for (let xIndex = 0; xIndex < xCoords.length - 1; xIndex += 1) {
      const filledCell = filled.has(`${xIndex}:${yIndex}`);
      const exposed = filledCell && !filled.has(`${xIndex}:${yIndex + 1}`);

      if (exposed && startX === null) {
        startX = xIndex;
      }

      if ((!exposed || xIndex === xCoords.length - 2) && startX !== null) {
        const endIndex = exposed && xIndex === xCoords.length - 2 ? xIndex + 1 : xIndex;
        segments.push({
          edge: 'bottom',
          id: `bottom-${startX}-${yIndex}-${endIndex}`,
          length: xCoords[endIndex] - xCoords[startX],
          x: xCoords[startX],
          y: yCoords[yIndex + 1],
        });
        startX = null;
      }
    }
  }

  for (let xIndex = 0; xIndex < xCoords.length - 1; xIndex += 1) {
    let startY: number | null = null;

    for (let yIndex = 0; yIndex < yCoords.length - 1; yIndex += 1) {
      const filledCell = filled.has(`${xIndex}:${yIndex}`);
      const exposed = filledCell && !filled.has(`${xIndex - 1}:${yIndex}`);

      if (exposed && startY === null) {
        startY = yIndex;
      }

      if ((!exposed || yIndex === yCoords.length - 2) && startY !== null) {
        const endIndex = exposed && yIndex === yCoords.length - 2 ? yIndex + 1 : yIndex;
        segments.push({
          edge: 'left',
          id: `left-${xIndex}-${startY}-${endIndex}`,
          length: yCoords[endIndex] - yCoords[startY],
          x: xCoords[xIndex],
          y: yCoords[startY],
        });
        startY = null;
      }
    }
  }

  for (let xIndex = 0; xIndex < xCoords.length - 1; xIndex += 1) {
    let startY: number | null = null;

    for (let yIndex = 0; yIndex < yCoords.length - 1; yIndex += 1) {
      const filledCell = filled.has(`${xIndex}:${yIndex}`);
      const exposed = filledCell && !filled.has(`${xIndex + 1}:${yIndex}`);

      if (exposed && startY === null) {
        startY = yIndex;
      }

      if ((!exposed || yIndex === yCoords.length - 2) && startY !== null) {
        const endIndex = exposed && yIndex === yCoords.length - 2 ? yIndex + 1 : yIndex;
        segments.push({
          edge: 'right',
          id: `right-${xIndex}-${startY}-${endIndex}`,
          length: yCoords[endIndex] - yCoords[startY],
          x: xCoords[xIndex + 1],
          y: yCoords[startY],
        });
        startY = null;
      }
    }
  }

  return segments;
}

function realignDockAnchor(anchor: DockAnchor, previousRect: CanvasRect, nextRect: CanvasRect, nextShape: ShapeRect[]) {
  const candidateSegments = getExposedEdgeSegments(nextShape).filter((segment) => segment.edge === anchor.edge);

  if (candidateSegments.length === 0) {
    return anchor;
  }

  const isHorizontal = anchor.edge === 'top' || anchor.edge === 'bottom';
  const previousSpan = isHorizontal ? Math.max(previousRect.width, 1) : Math.max(previousRect.height, 1);
  const nextSpan = isHorizontal ? Math.max(nextRect.width, 1) : Math.max(nextRect.height, 1);
  const previousCenter = isHorizontal ? anchor.x + anchor.length / 2 : anchor.y + anchor.length / 2;
  const targetCenter = (previousCenter / previousSpan) * nextSpan;

  const distanceToSegment = (segment: ExposedEdgeSegment) => {
    const segmentStart = isHorizontal ? segment.x : segment.y;
    const segmentEnd = segmentStart + segment.length;

    if (targetCenter < segmentStart) {
      return segmentStart - targetCenter;
    }

    if (targetCenter > segmentEnd) {
      return targetCenter - segmentEnd;
    }

    return 0;
  };

  const bestSegment = candidateSegments.reduce((best, candidate) =>
    distanceToSegment(candidate) < distanceToSegment(best) ? candidate : best
  );

  return {
    edge: bestSegment.edge,
    length: bestSegment.length,
    x: bestSegment.x,
    y: bestSegment.y,
  };
}

function realignDockPlacements(
  docks: DockPlacement[],
  previousRect: CanvasRect,
  nextRect: CanvasRect,
  nextShape: ShapeRect[]
) {
  return docks.map((dock) => {
    const anchor = realignDockAnchor(dock.anchor, previousRect, nextRect, nextShape);

    return {
      ...dock,
      anchor,
      edge: anchor.edge,
    };
  });
}

function getDockStripStyle(anchor: DockAnchor) {
  if (anchor.edge === 'top') {
    return { left: `${anchor.x}px`, top: `${anchor.y - 70}px`, width: `${anchor.length}px` };
  }

  if (anchor.edge === 'bottom') {
    return { left: `${anchor.x}px`, top: `${anchor.y - 16}px`, width: `${anchor.length}px` };
  }

  if (anchor.edge === 'left') {
    return { left: `${anchor.x - 70}px`, top: `${anchor.y}px`, height: `${anchor.length}px` };
  }

  return { left: `${anchor.x - 16}px`, top: `${anchor.y}px`, height: `${anchor.length}px` };
}

function getPointInBuildingLocalSpace(building: BuildingItem, point: { x: number; y: number }) {
  const centerX = building.rect.x + building.rect.width / 2;
  const centerY = building.rect.y + building.rect.height / 2;
  const radians = (-building.settings.angle * Math.PI) / 180;
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  const localDx = dx * Math.cos(radians) - dy * Math.sin(radians);
  const localDy = dx * Math.sin(radians) + dy * Math.cos(radians);

  return {
    x: localDx + building.rect.width / 2,
    y: localDy + building.rect.height / 2,
  };
}

function getSnappedRowPoint(anchor: { x: number; y: number }, point: { x: number; y: number }) {
  const deltaX = point.x - anchor.x;
  const deltaY = point.y - anchor.y;
  const snapThreshold = 18;

  if (Math.abs(deltaX) <= snapThreshold && Math.abs(deltaY) <= snapThreshold) {
    return Math.abs(deltaX) <= Math.abs(deltaY)
      ? { ...point, x: anchor.x }
      : { ...point, y: anchor.y };
  }

  if (Math.abs(deltaX) <= snapThreshold) {
    return { ...point, x: anchor.x };
  }

  if (Math.abs(deltaY) <= snapThreshold) {
    return { ...point, y: anchor.y };
  }

  return point;
}

function App() {
  const ZoomMinusIcon = () => (
    <svg aria-hidden="true" className="canvas-viewport-controls__glyph-svg" viewBox="0 0 24 24">
      <path
        d="M18 11C18.5523 11 19 11.4477 19 12C19 12.5523 18.5523 13 18 13L6 13C5.44772 13 5 12.5523 5 12C5 11.4477 5.44772 11 6 11L18 11Z"
        fill="currentColor"
      />
    </svg>
  );

  const ZoomPlusIcon = () => (
    <svg aria-hidden="true" className="canvas-viewport-controls__glyph-svg" viewBox="0 0 24 24">
      <path
        d="M12 5C11.4477 5 11 5.44772 11 6V11H6C5.44772 11 5 11.4477 5 12C5 12.5523 5.44772 13 6 13H11V18C11 18.5523 11.4477 19 12 19C12.5523 19 13 18.5523 13 18V13H18C18.5523 13 19 12.5523 19 12C19 11.4477 18.5523 11 18 11H13V6C13 5.44772 12.5523 5 12 5Z"
        fill="currentColor"
      />
    </svg>
  );

  const ZoomResetIcon = () => (
    <svg aria-hidden="true" className="canvas-viewport-controls__glyph-svg" viewBox="0 0 24 24">
      <path
        d="M20.1318 12.4719C19.5618 12.4179 19.0898 12.8139 19.0328 13.3619C18.8578 15.0239 18.1408 16.5289 16.9548 17.7159C14.1358 20.5319 9.5518 20.5319 6.7348 17.7159C3.9168 14.8969 3.9168 10.3129 6.7348 7.49489C9.2088 5.02189 13.0428 4.72089 15.8498 6.59089L14.1268 8.31489C13.9568 8.48489 14.0578 8.77489 14.2958 8.80389L20.0568 9.50289C20.2418 9.52589 20.3998 9.36789 20.3768 9.18289L19.6788 3.42189C19.6498 3.18289 19.3588 3.08289 19.1888 3.25289L17.2798 5.16189C13.6728 2.52689 8.5758 2.82589 5.3208 6.08089C1.7238 9.67889 1.7238 15.5319 5.3208 19.1299C7.1198 20.9289 9.4818 21.8269 11.8448 21.8269C14.2078 21.8269 16.5698 20.9279 18.3688 19.1299C19.8608 17.6379 20.8028 15.6629 21.0208 13.5709C21.0788 13.0209 20.6808 12.5299 20.1318 12.4719Z"
        fill="currentColor"
      />
    </svg>
  );

  const DirectionalArrowIcon = ({ className }: { className?: string }) => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.29033 13.9929L11.6841 8.38585C11.8583 8.20472 12.1415 8.20472 12.3157 8.38585L17.7104 13.9929C18.0965 14.3953 18.0965 15.0468 17.7104 15.4482V15.4482C17.3233 15.8506 16.6966 15.8506 16.3105 15.4482L11.9999 10.9681L7.69024 15.4482C7.30314 15.8506 6.67644 15.8506 6.29033 15.4482V15.4482C5.90322 15.0468 5.90322 14.3953 6.29033 13.9929Z"
        fill="currentColor"
      />
    </svg>
  );

  const UpDownChevronIcon = ({ direction, className }: { direction: 'up' | 'down'; className?: string }) => (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={direction === 'up' ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path
        d="M17.767 10.8839L12.319 16.3319C12.143 16.5079 11.857 16.5079 11.681 16.3319L6.23195 10.8839C5.84195 10.4929 5.84195 9.85987 6.23195 9.46987V9.46987C6.62295 9.07887 7.25595 9.07887 7.64595 9.46987L12 13.8229L16.353 9.46987C16.744 9.07887 17.377 9.07887 17.767 9.46987V9.46987C18.158 9.85987 18.158 10.4929 17.767 10.8839Z"
        fill="currentColor"
      />
    </svg>
  );

  const CloseIcon = ({ className }: { className?: string }) => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.9165 15.5688L13.3477 12L16.9165 8.43125C17.2892 8.05861 17.2885 7.45544 16.9165 7.08351C16.5439 6.71086 15.9414 6.71086 15.5688 7.08351L12 10.6523L8.43123 7.08351C8.05859 6.71086 7.45613 6.71086 7.08349 7.08351C6.71155 7.45544 6.71084 8.05861 7.08349 8.43125L10.6523 12L7.08349 15.5688C6.71155 15.9407 6.71084 16.5439 7.08349 16.9165C7.45542 17.2885 8.05929 17.2885 8.43123 16.9165L12 13.3478L15.5688 16.9165C15.9407 17.2885 16.5446 17.2885 16.9165 16.9165C17.2892 16.5439 17.2885 15.9407 16.9165 15.5688Z"
        fill="currentColor"
      />
    </svg>
  );

  const canvasAreaRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const transparentDragImageRef = useRef<HTMLDivElement | null>(null);
  const dropSucceededRef = useRef(false);
  const spaceRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const spaceIndicatorRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const spaceControlRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const idRef = useRef(1);
  const buildingPointerDownRef = useRef(false);
  const buildingDragDrawRef = useRef(false);
  const skipCanvasClickRef = useRef(false);
  const skipNextSpaceSelectClearRef = useRef(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [documentHandle, setDocumentHandle] = useState<FileSystemFileHandleLike | null>(null);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [rows, setRows] = useState<ParkingRow[]>([]);
  const [buildingDraftStart, setBuildingDraftStart] = useState<{ x: number; y: number } | null>(null);
  const [buildingDraftCurrent, setBuildingDraftCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isDrawingBuilding, setIsDrawingBuilding] = useState(false);
  const [rowDraftStart, setRowDraftStart] = useState<{ x: number; y: number } | null>(null);
  const [rowDraftCurrent, setRowDraftCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isDrawingRow, setIsDrawingRow] = useState(false);
  const [selectingEdge, setSelectingEdge] = useState(false);
  const [hoverTarget, setHoverTarget] = useState<{ buildingId: string; segmentId: string } | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<string[]>([]);
  const [hoveredSpaceKey, setHoveredSpaceKey] = useState<string | null>(null);
  const [isMoveTaskPopoverHovered, setIsMoveTaskPopoverHovered] = useState(false);
  const [operationsTrailerActionModal, setOperationsTrailerActionModal] = useState<OperationsTrailerActionModal | null>(null);
  const hoverClearTimeoutRef = useRef<number | null>(null);
  const [buildingDrag, setBuildingDrag] = useState<BuildingDrag | null>(null);
  const [buildingResize, setBuildingResize] = useState<BuildingResize | null>(null);
  const [buildingLabelDrag, setBuildingLabelDrag] = useState<BuildingLabelDrag | null>(null);
  const [buildingComponentDrag, setBuildingComponentDrag] = useState<BuildingComponentDrag | null>(null);
  const [buildingComponentResize, setBuildingComponentResize] = useState<BuildingComponentResize | null>(null);
  const [rowDrag, setRowDrag] = useState<RowDrag | null>(null);
  const [rowHandleDrag, setRowHandleDrag] = useState<RowHandleDrag | null>(null);
  const [editingCombinedBuildingId, setEditingCombinedBuildingId] = useState<string | null>(null);
  const [appMode, setAppMode] = useState<AppMode>('build');
  const [operationsAssignments, setOperationsAssignments] = useState<OperationsAssignments>({});
  const [moveTaskSelectionOverride, setMoveTaskSelectionOverride] = useState<string | null>(null);
  const [pullTaskSelectionOverride, setPullTaskSelectionOverride] = useState<string | null>(null);
  const [moveTaskConnectionRefresh, setMoveTaskConnectionRefresh] = useState(0);
  const [spaceDrag, setSpaceDrag] = useState<SpaceDrag | null>(null);
  const [dockDragHover, setDockDragHover] = useState<DockDragHover | null>(null);
  const [dragPreviewEdge, setDragPreviewEdge] = useState<Edge | null>(null);
  const [dragPreviewFollowsSourceAngle, setDragPreviewFollowsSourceAngle] = useState(true);
  const [dragPreviewAngleOverride, setDragPreviewAngleOverride] = useState<number | null>(null);
  const [dragReturnPreview, setDragReturnPreview] = useState<DragReturnPreview | null>(null);
  const [dragReturnActive, setDragReturnActive] = useState(false);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#eaeaea');
  const [canvasLocationName, setCanvasLocationName] = useState('Location 1');
  const [canvasPreviewsById, setCanvasPreviewsById] = useState<Record<string, string>>({});
  const [dockDoorEnabledBySpaceKey, setDockDoorEnabledBySpaceKey] = useState<Record<string, boolean>>({});
  const [isDockBindingsModalOpen, setIsDockBindingsModalOpen] = useState(false);
  const [dockBindingsDraft, setDockBindingsDraft] = useState<Record<string, boolean>>({});
  const [isCanvasPreviewCaptureMode, setIsCanvasPreviewCaptureMode] = useState(false);
  const isCapturingCanvasPreviewRef = useRef(false);
  const [viewport, setViewport] = useState<CanvasViewport>({ scale: 1, x: 0, y: 0 });
  const [canvasPan, setCanvasPan] = useState<CanvasPan | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [buildingSettings, setBuildingSettings] = useState(buildingDefaults);
  const [dockSettings, setDockSettings] = useState(dockDefaults);
  const [rowSettings, setRowSettings] = useState(rowDefaults);

  // Multi-canvas support (remote locations).
  const [activeCanvasId, setActiveCanvasId] = useState<string>('canvas-1');
  const [remoteCanvasSnapshots, setRemoteCanvasSnapshots] = useState<CanvasSnapshot[]>([]);
  // Index of the active canvas within the ordered previews list (including active, excluding the add button).
  const [activeCanvasIndex, setActiveCanvasIndex] = useState(0);
  const canvasIdCounterRef = useRef(2);

  const [autoSelectSpaceKeyByCanvasId, setAutoSelectSpaceKeyByCanvasId] = useState<Record<string, string>>({});
  const [remoteCanvasDropHover, setRemoteCanvasDropHover] = useState<RemoteCanvasDropHover | null>(null);
  const [hoveredRemoteCanvasButtonId, setHoveredRemoteCanvasButtonId] = useState<string | null>(null);
  const remoteCanvasButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    return () => {
      transparentDragImageRef.current?.remove();
      transparentDragImageRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!dragReturnPreview) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setDragReturnActive(true);
    });
    const timeoutId = window.setTimeout(() => {
      setDragReturnActive(false);
      setDragReturnPreview(null);
    }, 180);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [dragReturnPreview]);

  const handleOpenAddMenu = () => {
    setAddMenuOpen((current) => {
      const next = !current;
      if (next) {
        setMoreMenuOpen(false);
      }
      return next;
    });
  };

  const handleOpenMoreMenu = () => {
    setMoreMenuOpen((current) => {
      const next = !current;
      if (next) {
        setAddMenuOpen(false);
      }
      return next;
    });
  };

  const getWindowWithFilePickers = () =>
    window as Window &
      typeof globalThis & {
        showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandleLike[]>;
        showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandleLike>;
      };

  const getDocumentPayload = (mode: AppMode): FacilityDocument => ({
    appMode: mode,
    // Legacy (single-canvas) fields - kept so older files can still open.
    canvasBackgroundColor,
    buildings,
    idCounter: idRef.current,
    operationsAssignments:
      mode === 'operations' && Object.keys(operationsAssignments).length === 0
        ? applyDockDoorBindingsToAssignments(
            buildOperationsAssignments(buildings, rows, dockDoorEnabledBySpaceKey),
            dockDoorEnabledBySpaceKey
          )
        : mode === 'operations'
          ? applyDockDoorBindingsToAssignments(operationsAssignments, dockDoorEnabledBySpaceKey)
          : {},
    rows,
    viewport,

    // New (multi-canvas) fields.
    activeCanvasId,
    canvasLocations: [
      {
        id: activeCanvasId,
        name: canvasLocationName,
        canvasBackgroundColor,
        buildings,
        dockDoorEnabledBySpaceKey,
        operationsAssignments:
          mode === 'operations' && Object.keys(operationsAssignments).length === 0
            ? applyDockDoorBindingsToAssignments(
                buildOperationsAssignments(buildings, rows, dockDoorEnabledBySpaceKey),
                dockDoorEnabledBySpaceKey
              )
            : mode === 'operations'
              ? applyDockDoorBindingsToAssignments(operationsAssignments, dockDoorEnabledBySpaceKey)
              : {},
        rows,
        viewport,
        idCounter: idRef.current,
      },
      ...remoteCanvasSnapshots.map((snapshot) => ({
        ...snapshot,
        operationsAssignments:
          mode === 'operations' && Object.keys(snapshot.operationsAssignments).length === 0
            ? applyDockDoorBindingsToAssignments(
                buildOperationsAssignments(snapshot.buildings, snapshot.rows, snapshot.dockDoorEnabledBySpaceKey ?? {}),
                snapshot.dockDoorEnabledBySpaceKey ?? {}
              )
            : mode === 'operations'
              ? applyDockDoorBindingsToAssignments(
                  snapshot.operationsAssignments,
                  snapshot.dockDoorEnabledBySpaceKey ?? {}
                )
              : {},
      })),
    ],
  });

  const writeDocumentToHandle = async (handle: FileSystemFileHandleLike, mode: AppMode) => {
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(getDocumentPayload(mode), null, 2));
    await writable.close();
  };

  const downloadDocument = (mode: AppMode) => {
    const blob = new Blob([JSON.stringify(getDocumentPayload(mode), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'control-tower-3.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAsDocument = async () => {
    setMoreMenuOpen(false);
    const nextMode: AppMode = 'operations';
    const pickerWindow = getWindowWithFilePickers();

    try {
      if (pickerWindow.showSaveFilePicker) {
        const handle = await pickerWindow.showSaveFilePicker({
          excludeAcceptAllOption: true,
          suggestedName: 'control-tower-3.json',
          types: [
            {
              accept: { 'application/json': ['.json'] },
              description: 'Control Tower 3 drawing',
            },
          ],
        });

        await writeDocumentToHandle(handle, nextMode);
        setDocumentHandle(handle);
      } else {
        downloadDocument(nextMode);
        setDocumentHandle(null);
      }

      handleModeChange(nextMode);
    } catch {
      return;
    }
  };

  const handleSaveDocument = async () => {
    setMoreMenuOpen(false);
    const nextMode: AppMode = 'operations';

    try {
      if (documentHandle) {
        await writeDocumentToHandle(documentHandle, nextMode);
      } else {
        await handleSaveAsDocument();
        return;
      }

      handleModeChange(nextMode);
    } catch {
      window.alert('Unable to save that drawing file.');
    }
  };

  const handleNewDocument = () => {
    setMoreMenuOpen(false);
    setDocumentHandle(null);
    resetInteractions();
    setAppMode('build');

    setActiveCanvasId('canvas-1');
    setRemoteCanvasSnapshots([]);
    canvasIdCounterRef.current = 2;
    setAutoSelectSpaceKeyByCanvasId({});

    setBuildings([]);
    setRows([]);
    setOperationsAssignments({});
    setCanvasBackgroundColor('#eaeaea');
    setCanvasLocationName('Location 1');
    setViewport({ scale: 1, x: 0, y: 0 });
    idRef.current = 1;
    setSelection(null);
    setBuildingSettings(buildingDefaults);
    setDockSettings(dockDefaults);
    setRowSettings(rowDefaults);
  };

  const handleOpenDocument = async () => {
    setMoreMenuOpen(false);
    const pickerWindow = getWindowWithFilePickers();

    if (pickerWindow.showOpenFilePicker) {
      try {
        const [handle] = await pickerWindow.showOpenFilePicker({
          excludeAcceptAllOption: true,
          multiple: false,
          types: [
            {
              accept: { 'application/json': ['.json'] },
              description: 'Control Tower 3 drawing',
            },
          ],
        });

        const file = await handle.getFile();
        setDocumentHandle(handle);
        await loadDocumentFile(file);
      } catch {
        return;
      }

      return;
    }

    fileInputRef.current?.click();
  };

  const loadDocumentFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const doc = JSON.parse(text) as FacilityDocument;
      const nextMode = doc.appMode === 'operations' ? 'operations' : 'build';

      if (Array.isArray(doc.canvasLocations) && doc.canvasLocations.length > 0) {
        const nextLocations = doc.canvasLocations.map((loc) => ({
          id: loc.id,
          name: loc.name,
          canvasBackgroundColor: loc.canvasBackgroundColor ?? '#eaeaea',
          buildings: Array.isArray(loc.buildings) ? loc.buildings : [],
          dockDoorEnabledBySpaceKey: loc.dockDoorEnabledBySpaceKey ?? {},
          rows: Array.isArray(loc.rows) ? loc.rows : [],
          viewport: loc.viewport ?? { scale: 1, x: 0, y: 0 },
          operationsAssignments: applyDockDoorBindingsToAssignments(
            loc.operationsAssignments ?? {},
            loc.dockDoorEnabledBySpaceKey ?? {}
          ),
          idCounter: typeof loc.idCounter === 'number' ? loc.idCounter : 1,
        }));

        const nextActiveId = doc.activeCanvasId ?? nextLocations[0].id;
        const nextActive =
          nextLocations.find((loc) => loc.id === nextActiveId) ??
          nextLocations[0];

        const nextActiveIndex = nextLocations.findIndex((loc) => loc.id === nextActive.id);
        const nextRemote = nextLocations.filter((loc) => loc.id !== nextActive.id);

        setAppMode(nextMode);
        setActiveCanvasId(nextActive.id);
        setActiveCanvasIndex(nextActiveIndex >= 0 ? nextActiveIndex : 0);
        setRemoteCanvasSnapshots(nextRemote);
        setAutoSelectSpaceKeyByCanvasId({});

        setCanvasBackgroundColor(nextActive.canvasBackgroundColor);
        setCanvasLocationName(nextActive.name);
        setDockDoorEnabledBySpaceKey(nextActive.dockDoorEnabledBySpaceKey ?? {});
        setBuildings(nextActive.buildings);
        setRows(nextActive.rows);
        setViewport(nextActive.viewport);
        setOperationsAssignments(
          nextMode === 'operations'
            ? Object.keys(nextActive.operationsAssignments ?? {}).length > 0
              ? applyDockDoorBindingsToAssignments(
                  nextActive.operationsAssignments,
                  nextActive.dockDoorEnabledBySpaceKey ?? {}
                )
              : applyDockDoorBindingsToAssignments(
                  buildOperationsAssignments(nextActive.buildings, nextActive.rows, nextActive.dockDoorEnabledBySpaceKey ?? {}),
                  nextActive.dockDoorEnabledBySpaceKey ?? {}
                )
            : applyDockDoorBindingsToAssignments(
                nextActive.operationsAssignments ?? {},
                nextActive.dockDoorEnabledBySpaceKey ?? {}
              )
        );
        idRef.current = nextActive.idCounter;

        const maxCanvasIndex = nextLocations.reduce((max, loc) => {
          const match = /^canvas-(\d+)$/.exec(loc.id);
          if (!match) {
            return max;
          }
          return Math.max(max, Number(match[1]));
        }, 1);
        canvasIdCounterRef.current = maxCanvasIndex + 1;
      } else {
        const nextBuildings = Array.isArray(doc.buildings) ? doc.buildings : [];
        const nextRows = Array.isArray(doc.rows) ? doc.rows : [];

        setAppMode(nextMode);
        setActiveCanvasId('canvas-1');
        setActiveCanvasIndex(0);
        setRemoteCanvasSnapshots([]);
        setDockDoorEnabledBySpaceKey({});
        setAutoSelectSpaceKeyByCanvasId({});

        setCanvasBackgroundColor(doc.canvasBackgroundColor ?? '#eaeaea');
        setCanvasLocationName('Location 1');
        setBuildings(nextBuildings);
        setOperationsAssignments(
          applyDockDoorBindingsToAssignments(
            doc.operationsAssignments ??
              (nextMode === 'operations' ? buildOperationsAssignments(nextBuildings, nextRows, {}) : {}),
            {}
          )
        );
        setRows(nextRows);
        setViewport(doc.viewport ?? { scale: 1, x: 0, y: 0 });
        idRef.current = typeof doc.idCounter === 'number' ? doc.idCounter : 1;
      }

      setMoveTaskSelectionOverride(null);
      setSelection(null);
      setSelectedBuildingIds([]);
      setEditingCombinedBuildingId(null);
      setAddMenuOpen(false);
      setMoreMenuOpen(false);
    } catch {
      window.alert('Unable to open that drawing file.');
    }
  };

  const handleDocumentSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setDocumentHandle(null);
    await loadDocumentFile(file ?? null);
    event.target.value = '';
  };

  const resetInteractions = () => {
    setAddMenuOpen(false);
    setMoreMenuOpen(false);
    setBuildingDraftStart(null);
    setBuildingDraftCurrent(null);
    setIsDrawingBuilding(false);
    setRowDraftStart(null);
    setRowDraftCurrent(null);
    setIsDrawingRow(false);
    setSelectingEdge(false);
    setHoverTarget(null);
    setSelectedBuildingIds([]);
    setBuildingDrag(null);
    setBuildingResize(null);
    setBuildingLabelDrag(null);
    setBuildingComponentDrag(null);
    setBuildingComponentResize(null);
    setRowDrag(null);
    setRowHandleDrag(null);
    setMoveTaskSelectionOverride(null);
    setPullTaskSelectionOverride(null);
    setSpaceDrag(null);
    setEditingCombinedBuildingId(null);
    setCanvasPan(null);
    buildingPointerDownRef.current = false;
    buildingDragDrawRef.current = false;
    skipCanvasClickRef.current = false;
  };

  const getActiveCanvasSnapshot = (): CanvasSnapshot => ({
    id: activeCanvasId,
    name: canvasLocationName,
    canvasBackgroundColor,
    buildings,
    operationsAssignments: applyDockDoorBindingsToAssignments(operationsAssignments, dockDoorEnabledBySpaceKey),
    dockDoorEnabledBySpaceKey,
    rows,
    viewport,
    idCounter: idRef.current,
  });

  const setActiveCanvasFromSnapshot = (snapshot: CanvasSnapshot) => {
    resetInteractions();
    setSelection(null);
    setDockDragHover(null);
    setRemoteCanvasDropHover(null);

    idRef.current = snapshot.idCounter;
    setCanvasBackgroundColor(snapshot.canvasBackgroundColor);
    setCanvasLocationName(snapshot.name);
    setDockDoorEnabledBySpaceKey(snapshot.dockDoorEnabledBySpaceKey ?? {});
    setBuildings(snapshot.buildings);
    setRows(snapshot.rows);
    setViewport(snapshot.viewport);
    setOperationsAssignments(
      applyDockDoorBindingsToAssignments(snapshot.operationsAssignments, snapshot.dockDoorEnabledBySpaceKey ?? {})
    );
  };

  const captureCanvasPreviewForId = async (canvasId: string) => {
    if (!canvasAreaRef.current) {
      return;
    }
    if (isCapturingCanvasPreviewRef.current) {
      return;
    }

    isCapturingCanvasPreviewRef.current = true;
    setIsCanvasPreviewCaptureMode(true);

    try {
      // Let React apply `display: none` for overlay controls before capturing.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), 0);
      });

      const dataUrl = await toPng(canvasAreaRef.current, {
        cacheBust: true,
        pixelRatio: window.devicePixelRatio ?? 1,
        filter: (node) => {
          const element = node as Element | null;
          if (!element || !('classList' in element)) {
            return true;
          }
          const classList = (element as Element).classList;
          if (classList.contains('canvas-viewport-controls') || classList.contains('canvas-remote-controls')) {
            return false;
          }
          return true;
        },
      });

      setCanvasPreviewsById((current) => ({ ...current, [canvasId]: dataUrl }));
    } catch {
      // Preview generation is best-effort.
    } finally {
      setIsCanvasPreviewCaptureMode(false);
      isCapturingCanvasPreviewRef.current = false;
    }
  };

  // Keep remote previews in sync if the active canvas snapshot is present in the remote list
  // (e.g. when switching canvases, or when state is restored from older documents).
  useEffect(() => {
    setRemoteCanvasSnapshots((current) => {
      const existing = current.find((snapshot) => snapshot.id === activeCanvasId);
      if (!existing) {
        return current;
      }

      return current.map((snapshot) => (snapshot.id === activeCanvasId ? getActiveCanvasSnapshot() : snapshot));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeCanvasId,
    canvasLocationName,
    canvasBackgroundColor,
    dockDoorEnabledBySpaceKey,
    buildings,
    rows,
    viewport,
    operationsAssignments,
  ]);

  useEffect(() => {
    setOperationsAssignments((current) =>
      reconcileOperationsAssignments(current, buildings, rows, dockDoorEnabledBySpaceKey)
    );
  }, [dockDoorEnabledBySpaceKey, buildings, rows]);

  const handleAddCanvas = async () => {
    await captureCanvasPreviewForId(activeCanvasId);
    const activeSnapshot = getActiveCanvasSnapshot();

    // Preserve current canvas order: the previous active becomes remote at its existing slot,
    // and the new empty canvas becomes the last active slot.
    const orderedPrevious: CanvasSnapshot[] = [];
    let remoteIdx = 0;
    const totalPrevious = remoteCanvasSnapshots.length + 1;
    const safeActiveIndex = Math.min(Math.max(activeCanvasIndex, 0), Math.max(0, totalPrevious - 1));
    for (let i = 0; i < totalPrevious; i += 1) {
      if (i === safeActiveIndex) {
        orderedPrevious.push(activeSnapshot);
      } else {
        orderedPrevious.push(remoteCanvasSnapshots[remoteIdx]);
        remoteIdx += 1;
      }
    }

    setRemoteCanvasSnapshots(orderedPrevious);

    const nextLocationIndex = canvasIdCounterRef.current;
    const nextCanvasId = `canvas-${nextLocationIndex}`;
    canvasIdCounterRef.current += 1;
    const nextLocationName = `Location ${nextLocationIndex}`;

    setActiveCanvasId(nextCanvasId);
    setActiveCanvasIndex(orderedPrevious.length);
    setCanvasLocationName(nextLocationName);
    setAutoSelectSpaceKeyByCanvasId((current) => {
      if (!current[nextCanvasId]) {
        return current;
      }
      const next = { ...current };
      delete next[nextCanvasId];
      return next;
    });

    resetInteractions();
    setSelection(null);
    setDockDragHover(null);
    setRemoteCanvasDropHover(null);

    idRef.current = 1;
    setCanvasBackgroundColor('#eaeaea');
    setDockDoorEnabledBySpaceKey({});
    setBuildings([]);
    setRows([]);
    setOperationsAssignments({});
    setViewport({ scale: 1, x: 0, y: 0 });
  };

  const handleDeleteActiveLocation = () => {
    const totalLocations = remoteCanvasSnapshots.length + 1;
    if (totalLocations <= 1) {
      return;
    }

    const removedCanvasId = activeCanvasId;

    const activeSnapshot = getActiveCanvasSnapshot();
    const safeActiveIndex = Math.min(Math.max(activeCanvasIndex, 0), totalLocations - 1);

    // Rebuild full ordered list (active + remotes) so index math stays consistent.
    const fullOrderedSnapshots: CanvasSnapshot[] = [];
    let remoteIdx = 0;
    for (let i = 0; i < totalLocations; i += 1) {
      if (i === safeActiveIndex) {
        fullOrderedSnapshots.push(activeSnapshot);
      } else {
        fullOrderedSnapshots.push(remoteCanvasSnapshots[remoteIdx]);
        remoteIdx += 1;
      }
    }

    // Remove the active canvas from the ordered list.
    fullOrderedSnapshots.splice(safeActiveIndex, 1);

    if (fullOrderedSnapshots.length === 0) {
      // Should be impossible because totalLocations > 1, but keep it safe.
      return;
    }

    // Pick the new active canvas using the same index when possible.
    const nextActiveIndex = Math.min(safeActiveIndex, fullOrderedSnapshots.length - 1);
    const nextActiveSnapshot = fullOrderedSnapshots[nextActiveIndex];

    setActiveCanvasId(nextActiveSnapshot.id);
    setActiveCanvasIndex(nextActiveIndex);
    setRemoteCanvasSnapshots(fullOrderedSnapshots.filter((s) => s.id !== nextActiveSnapshot.id));

    // Clean up UI state that is tied to the old active canvas.
    setCanvasPreviewsById((current) => {
      if (!current[removedCanvasId]) {
        return current;
      }
      const next = { ...current };
      delete next[removedCanvasId];
      return next;
    });
    setAutoSelectSpaceKeyByCanvasId((current) => {
      if (!current[removedCanvasId]) {
        return current;
      }
      const next = { ...current };
      delete next[removedCanvasId];
      return next;
    });

    setHoveredRemoteCanvasButtonId(null);
    setDockDragHover(null);
    setRemoteCanvasDropHover(null);
    setMoveTaskSelectionOverride(null);

    // Apply the new active snapshot.
    setActiveCanvasFromSnapshot(nextActiveSnapshot);
  };

  const handleSwitchToRemoteCanvas = (remoteCanvasId: string) => {
    if (remoteCanvasId === activeCanvasId) {
      return;
    }

    // Switching no longer waits for thumbnail re-capture, so ensure the preview reflects
    // the latest snapshot data (SVG mini-preview will be used if the PNG is cleared).
    setCanvasPreviewsById((current) => {
      if (!current[activeCanvasId]) {
        return current;
      }
      const next = { ...current };
      delete next[activeCanvasId];
      return next;
    });

    const targetSnapshot = remoteCanvasSnapshots.find((snapshot) => snapshot.id === remoteCanvasId);
    if (!targetSnapshot) {
      return;
    }

    // Swap active and target snapshots in-place to keep canvas order stable.
    const activeSnapshot = getActiveCanvasSnapshot();
    const fullOrderedSnapshots: CanvasSnapshot[] = [];
    let remoteIdx = 0;
    const total = remoteCanvasSnapshots.length + 1;
    const safeActiveIndex = Math.min(Math.max(activeCanvasIndex, 0), Math.max(0, total - 1));
    for (let i = 0; i < total; i += 1) {
      if (i === safeActiveIndex) {
        fullOrderedSnapshots.push(activeSnapshot);
      } else {
        fullOrderedSnapshots.push(remoteCanvasSnapshots[remoteIdx]);
        remoteIdx += 1;
      }
    }

    const targetFullIndex = fullOrderedSnapshots.findIndex((s) => s.id === remoteCanvasId);
    if (targetFullIndex < 0) {
      return;
    }

    fullOrderedSnapshots[safeActiveIndex] = targetSnapshot;
    fullOrderedSnapshots[targetFullIndex] = activeSnapshot;

    // Clear UI state tied to the previous canvas so stale modals/highlights don't linger.
    setSelection(null);
    setOperationsTrailerActionModal(null);
    setMoveTaskSelectionOverride(null);
    setPullTaskSelectionOverride(null);
    setDockDragHover(null);
    setRemoteCanvasDropHover(null);

    setRemoteCanvasSnapshots(fullOrderedSnapshots.filter((s) => s.id !== remoteCanvasId));
    setActiveCanvasId(remoteCanvasId);
    setActiveCanvasIndex(targetFullIndex);

    setActiveCanvasFromSnapshot(targetSnapshot);

    const autoSelectSpaceKey = autoSelectSpaceKeyByCanvasId[remoteCanvasId];
    if (autoSelectSpaceKey && appMode === 'operations') {
      setSelection({ spaceKey: autoSelectSpaceKey, type: 'space' });
      const autoAssignment = targetSnapshot.operationsAssignments[autoSelectSpaceKey];
      const autoTrailerNumber = autoAssignment?.trailer?.trailerNumber ?? null;
      if (autoAssignment?.state === 'move-task' && autoTrailerNumber) {
        setMoveTaskSelectionOverride(autoTrailerNumber);
      }
      if (autoAssignment?.state === 'pull-task' && autoTrailerNumber) {
        setPullTaskSelectionOverride(autoTrailerNumber);
      }
      setAutoSelectSpaceKeyByCanvasId((current) => {
        const next = { ...current };
        delete next[remoteCanvasId];
        return next;
      });
    }
  };

  const CanvasMiniPreview = ({ snapshot }: { snapshot: CanvasSnapshot }) => {
    const size = 56;
    const pad = 4;
    const points: Array<{ x: number; y: number }> = [];

    // Build bounding box from building shape + dock strips, so the thumbnail doesn't clip.
    snapshot.buildings.forEach((building) => {
      if (building.shape.length > 0) {
        building.shape.forEach((segment) => {
          points.push({ x: segment.x, y: segment.y });
          points.push({ x: segment.x + segment.width, y: segment.y + segment.height });
        });
      } else {
        points.push({ x: building.rect.x, y: building.rect.y });
        points.push({ x: building.rect.x + building.rect.width, y: building.rect.y + building.rect.height });
      }

      building.docks.forEach((dockPlacement) => {
        const { x, y, length, edge } = dockPlacement.anchor;

        // Dock-strip anchors include layout offsets (see `getDockStripStyle` + dock sizes in CSS).
        if (edge === 'top') {
          points.push({ x, y: y - 70 });
          points.push({ x: x + length, y: y - 70 + 86 });
          return;
        }

        if (edge === 'bottom') {
          points.push({ x, y: y - 16 });
          points.push({ x: x + length, y: y - 16 + 86 });
          return;
        }

        if (edge === 'left') {
          points.push({ x: x - 70, y });
          points.push({ x: x - 70 + 86, y: y + length });
          return;
        }

        // right
        points.push({ x: x - 16, y });
        points.push({ x: x - 16 + 86, y: y + length });
      });
    });

    snapshot.rows.forEach((row) => {
      points.push(row.start);
      points.push(row.end);
    });

    if (points.length === 0) {
      return (
        <svg aria-hidden="true" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
          <rect x={0} y={0} width={size} height={size} rx={8} fill={snapshot.canvasBackgroundColor} />
        </svg>
      );
    }

    const minX = points.reduce((m, p) => Math.min(m, p.x), Number.POSITIVE_INFINITY);
    const minY = points.reduce((m, p) => Math.min(m, p.y), Number.POSITIVE_INFINITY);
    const maxX = points.reduce((m, p) => Math.max(m, p.x), Number.NEGATIVE_INFINITY);
    const maxY = points.reduce((m, p) => Math.max(m, p.y), Number.NEGATIVE_INFINITY);

    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);

    const inner = size - pad * 2;
    const scale = inner / Math.max(spanX, spanY);

    const mapX = (x: number) => pad + (x - minX) * scale;
    const mapY = (y: number) => pad + (y - minY) * scale;

    const dotRadius = Math.max(1.1, 1.6 * scale);

    return (
      <svg aria-hidden="true" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <rect x={0} y={0} width={size} height={size} rx={8} fill={snapshot.canvasBackgroundColor} />

        {/* Buildings */}
        {snapshot.buildings.flatMap((building) =>
          building.shape.map((segment) => (
            <rect
              key={`${building.id}-${segment.x}-${segment.y}-${segment.width}-${segment.height}`}
              x={mapX(segment.x)}
              y={mapY(segment.y)}
              width={Math.max(0.5, segment.width * scale)}
              height={Math.max(0.5, segment.height * scale)}
              rx={1}
              fill={building.settings.color}
              opacity={0.22}
              stroke="#003b5c"
              strokeWidth={0.5}
            />
          ))
        )}

        {/* Docks (dock-slot markers along dock strips) */}
        {snapshot.buildings.flatMap((building) =>
          building.docks.flatMap((dockPlacement) => {
            const dockSlots = getDockNumbers(dockPlacement.settings);
            const slots = dockSlots.length;
            const step = dockPlacement.anchor.length / Math.max(1, slots);

            const originX = dockPlacement.anchor.x;
            const originY = dockPlacement.anchor.y;
            const edge = dockPlacement.anchor.edge;

            return dockSlots.map((slotLabel, slotIndex) => {
              const spaceKey = getDockSpaceKey(building.id, dockPlacement.id, slotLabel);
              const assignment = snapshot.operationsAssignments[spaceKey];
              const hasTrailer = Boolean(assignment?.trailer);

              // Dock element centers (matching dock-strip offsets).
              let centerX = originX;
              let centerY = originY;

              if (edge === 'top') {
                centerX = originX + step * (slotIndex + 0.5);
                centerY = originY - 70 + 43;
              } else if (edge === 'bottom') {
                centerX = originX + step * (slotIndex + 0.5);
                centerY = originY - 16 + 43;
              } else if (edge === 'left') {
                centerX = originX - 70 + 43;
                centerY = originY + step * (slotIndex + 0.5);
              } else {
                // right
                centerX = originX - 16 + 43;
                centerY = originY + step * (slotIndex + 0.5);
              }

              const x = mapX(centerX);
              const y = mapY(centerY);

              // Convert dock marker sizes into preview pixel space.
              // Clamp to a minimum so markers don't disappear at small scales.
              const markerWorldW = edge === 'left' || edge === 'right' ? 8 : 6;
              const markerWorldH = edge === 'left' || edge === 'right' ? 6 : 10;
              const markerW = Math.max(1.6, markerWorldW * scale);
              const markerH = Math.max(1.2, markerWorldH * scale);
              const markerRx = Math.min(markerW / 2, markerH / 2, Math.max(0.6, 0.8 * scale));

              return (
                <g key={`${dockPlacement.id}-${slotLabel}`}>
                  <rect
                    x={x - markerW / 2}
                    y={y - markerH / 2}
                    width={markerW}
                    height={markerH}
                    rx={markerRx}
                    fill={hasTrailer ? '#009cde' : '#003b5c'}
                    opacity={hasTrailer ? 0.55 : 0.25}
                    stroke={hasTrailer ? '#ffffff' : undefined}
                    strokeWidth={hasTrailer ? 1 : 0}
                  />
                  {hasTrailer ? <circle cx={x} cy={y} r={dotRadius * 0.7} fill="#009cde" opacity={0.95} /> : null}
                </g>
              );
            });
          })
        )}

        {/* Rows */}
        {snapshot.rows.map((row) => {
          const dx = row.end.x - row.start.x;
          const dy = row.end.y - row.start.y;
          const length = Math.hypot(dx, dy);
          if (length < 1) {
            return null;
          }

          const ux = dx / length;
          const uy = dy / length;
          // Perpendicular normal for slot ticks.
          const nx = -uy;
          const ny = ux;

          const rowEdge = row.settings.side === 'Left' ? 'top' : 'bottom';
          const slotLabels = getDockNumbers({ ...row.settings, name: '' });
          const slotCount = Math.max(1, slotLabels.length);

          const maxTicks = 12;
          const tickStepIndex = Math.max(1, Math.ceil(slotCount / maxTicks));

          const tickSign = rowEdge === 'top' ? -1 : 1;
          const offsetWorld = 14;

          return (
            <g key={row.id}>
              <line
                x1={mapX(row.start.x)}
                y1={mapY(row.start.y)}
                x2={mapX(row.end.x)}
                y2={mapY(row.end.y)}
                stroke="#003b5c"
                strokeWidth={Math.max(0.75, 1 * scale)}
                opacity={0.35}
                strokeDasharray="4 3"
              />
              {slotLabels.map((slotLabel, slotIndex) => {
                if (slotIndex % tickStepIndex !== 0) {
                  return null;
                }

                const t = (slotIndex + 0.5) / slotCount;
                const centerX = row.start.x + dx * t;
                const centerY = row.start.y + dy * t;

                const tickX = centerX + nx * offsetWorld * tickSign;
                const tickY = centerY + ny * offsetWorld * tickSign;

                const spaceKey = getRowSpaceKey(row.id, slotLabel);
                const assignment = snapshot.operationsAssignments[spaceKey];
                const hasTrailer = Boolean(assignment?.trailer);

                // Match dock marker styling: rectangular, scaled by `scale`, with min sizes.
                const rowMarkerWorldW = 6;
                const rowMarkerWorldH = 10;
                const rowMarkerW = Math.max(1.6, rowMarkerWorldW * scale);
                const rowMarkerH = Math.max(1.2, rowMarkerWorldH * scale);
                const rowMarkerRx = Math.min(rowMarkerW / 2, rowMarkerH / 2, Math.max(0.6, 0.8 * scale));

                return (
                  <rect
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${row.id}-${slotLabel}`}
                    x={mapX(tickX) - rowMarkerW / 2}
                    y={mapY(tickY) - rowMarkerH / 2}
                    width={rowMarkerW}
                    height={rowMarkerH}
                    rx={rowMarkerRx}
                    fill={hasTrailer ? '#009cde' : '#003b5c'}
                    opacity={hasTrailer ? 0.55 : 0.25}
                    stroke={hasTrailer ? '#ffffff' : undefined}
                    strokeWidth={hasTrailer ? 1 : 0}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  };

  const handleDropTrailerOnRemoteCanvas = (remoteCanvasId: string) => {
    if (appMode !== 'operations' || !spaceDrag?.sourceSpaceKey) {
      return;
    }

    const sourceSpaceKey = spaceDrag.sourceSpaceKey;
    const sourceAssignment = operationsAssignments[sourceSpaceKey];
    const isCompletePullTaskTransfer =
      sourceAssignment?.type === 'dock' && sourceAssignment.state === 'issue';

    if (!sourceAssignment?.trailer) {
      return;
    }

    const targetSnapshot = remoteCanvasSnapshots.find((snapshot) => snapshot.id === remoteCanvasId);
    if (!targetSnapshot) {
      return;
    }

    const trailerToSend = sourceAssignment.trailer;

    let nextBuildings = targetSnapshot.buildings;
    let nextRows = targetSnapshot.rows;
    let nextIdCounter = targetSnapshot.idCounter;

    const shouldRebuildOps = targetSnapshot.rows.length === 0 || Object.keys(targetSnapshot.operationsAssignments).length === 0;

    let nextOps: OperationsAssignments = shouldRebuildOps
      ? applyDockDoorBindingsToAssignments(
          buildOperationsAssignments(nextBuildings, nextRows, targetSnapshot.dockDoorEnabledBySpaceKey ?? {}),
          targetSnapshot.dockDoorEnabledBySpaceKey ?? {}
        )
      : applyDockDoorBindingsToAssignments(
          { ...targetSnapshot.operationsAssignments },
          targetSnapshot.dockDoorEnabledBySpaceKey ?? {}
        );

    const yardEntries = Object.entries(nextOps).filter(([, assignment]) => assignment.type === 'yard');
    const dockEntries = Object.entries(nextOps).filter(([, assignment]) => assignment.type === 'dock');
    const availableYardEntry =
      yardEntries.find(([, assignment]) => assignment.state === 'default' && assignment.trailer === null) ??
      yardEntries.find(([, assignment]) => assignment.trailer === null);
    const availableDockEntry = dockEntries.find(
      ([, assignment]) => assignment.state === 'default' && assignment.trailer === null
    );

    // Completed dock items are pull-tasks and must route to yard destinations (including converted docks).
    if (isCompletePullTaskTransfer && !availableYardEntry) {
      return;
    }

    let destinationKey: string;
    if (isCompletePullTaskTransfer) {
      destinationKey = availableYardEntry![0];
    } else if (availableDockEntry) {
      destinationKey = availableDockEntry[0];
    } else {
      if (yardEntries.length === 0) {
        return;
      }
      const emptyYardEntry = yardEntries.find(([, assignment]) => assignment.state === 'default' && assignment.trailer === null);
      const occupiedYardEntry = yardEntries.find(([, assignment]) => assignment.trailer !== null);
      const yardEntryToUse = emptyYardEntry ?? (occupiedYardEntry ? yardEntries[0] : yardEntries[0]);
      destinationKey = yardEntryToUse[0];
    }

    nextOps[destinationKey] = {
      ...nextOps[destinationKey],
      state: isCompletePullTaskTransfer ? 'pull-task' : 'move-task',
      trailer: trailerToSend,
      remoteMoveTaskRole: 'destination',
    };

    setRemoteCanvasSnapshots((current) =>
      current.map((snapshot) =>
        snapshot.id === remoteCanvasId
          ? {
              ...snapshot,
              buildings: nextBuildings,
              rows: nextRows,
              idCounter: nextIdCounter,
              operationsAssignments: nextOps,
            }
          : snapshot
      )
    );

    setAutoSelectSpaceKeyByCanvasId((current) => ({
      ...current,
      [remoteCanvasId]: destinationKey as string,
    }));

    setOperationsAssignments((current) => {
      const next = { ...current };
      const assignment = next[sourceSpaceKey];
      if (!assignment) {
        return current;
      }
      next[sourceSpaceKey] = {
        ...assignment,
        state: isCompletePullTaskTransfer ? 'pull-task' : 'move-task',
        remoteMoveTaskRole: 'source',
      };
      return next;
    });

    dropSucceededRef.current = true;
    setDockDragHover(null);
    setDragPreviewEdge(null);
    setDragPreviewFollowsSourceAngle(true);
    setDragPreviewAngleOverride(null);
    setSpaceDrag(null);
    setRemoteCanvasDropHover(null);
    if (isCompletePullTaskTransfer) {
      setMoveTaskSelectionOverride(null);
      setPullTaskSelectionOverride(trailerToSend.trailerNumber);
    } else {
      setPullTaskSelectionOverride(null);
      setMoveTaskSelectionOverride(trailerToSend.trailerNumber);
    }
    setSelection({ spaceKey: sourceSpaceKey, type: 'space' });
    setDragReturnPreview(null);
  };

  const handleModeChange = (nextMode: AppMode) => {
    if (nextMode === appMode) {
      return;
    }

    resetInteractions();
    setSelection(null);

    if (nextMode === 'operations') {
      setOperationsAssignments((current) =>
        Object.keys(current).length === 0
          ? applyDockDoorBindingsToAssignments(
              buildOperationsAssignments(buildings, rows, dockDoorEnabledBySpaceKey),
              dockDoorEnabledBySpaceKey
            )
          : applyDockDoorBindingsToAssignments(current, dockDoorEnabledBySpaceKey)
      );
    }

    setAppMode(nextMode);
  };

  const handleStartBuilding = () => {
    if (appMode !== 'build') {
      return;
    }

    setAddMenuOpen(false);
    setMoreMenuOpen(false);
    setBuildingDraftStart(null);
    setBuildingDraftCurrent(null);
    setIsDrawingBuilding(true);
    setRowDraftStart(null);
    setRowDraftCurrent(null);
    setIsDrawingRow(false);
    setSelectingEdge(false);
    setHoverTarget(null);
    setSelection(null);
    setSelectedBuildingIds([]);
    setBuildingDrag(null);
    setBuildingResize(null);
    setBuildingLabelDrag(null);
    setBuildingComponentDrag(null);
    setBuildingComponentResize(null);
    setRowDrag(null);
    setRowHandleDrag(null);
    setEditingCombinedBuildingId(null);
    buildingPointerDownRef.current = false;
    buildingDragDrawRef.current = false;
    skipCanvasClickRef.current = false;
  };

  const handleStartRow = () => {
    if (appMode !== 'build') {
      return;
    }

    setAddMenuOpen(false);
    setMoreMenuOpen(false);
    setRowDraftStart(null);
    setRowDraftCurrent(null);
    setIsDrawingRow(true);
    setBuildingDraftStart(null);
    setBuildingDraftCurrent(null);
    setIsDrawingBuilding(false);
    setSelectingEdge(false);
    setHoverTarget(null);
    setSelection(null);
    setSelectedBuildingIds([]);
    setBuildingDrag(null);
    setBuildingResize(null);
    setBuildingLabelDrag(null);
    setBuildingComponentDrag(null);
    setBuildingComponentResize(null);
    setRowDrag(null);
    setRowHandleDrag(null);
    setEditingCombinedBuildingId(null);
    buildingPointerDownRef.current = false;
    buildingDragDrawRef.current = false;
    skipCanvasClickRef.current = false;
  };

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    const canvasStyles = canvasRef.current ? window.getComputedStyle(canvasRef.current) : null;
    const visibleWorldBounds = getVisibleWorldBounds();

    if (!bounds || !canvasStyles || !visibleWorldBounds) {
      return null;
    }

    const originX = bounds.left + parseFloat(canvasStyles.paddingLeft || '0');
    const originY = bounds.top + parseFloat(canvasStyles.paddingTop || '0');
    const worldX = (clientX - originX - viewport.x) / viewport.scale;
    const worldY = (clientY - originY - viewport.y) / viewport.scale;

    return {
      x: Math.max(visibleWorldBounds.minX, Math.min(worldX, visibleWorldBounds.maxX)),
      y: Math.max(visibleWorldBounds.minY, Math.min(worldY, visibleWorldBounds.maxY)),
    };
  };

  const getVisibleWorldBounds = () => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    const canvasStyles = canvasRef.current ? window.getComputedStyle(canvasRef.current) : null;

    if (!bounds || !canvasStyles) {
      return null;
    }

    const paddingLeft = parseFloat(canvasStyles.paddingLeft || '0');
    const paddingTop = parseFloat(canvasStyles.paddingTop || '0');
    return {
      maxX: (bounds.width - paddingLeft - viewport.x) / viewport.scale,
      maxY: (bounds.height - paddingTop - viewport.y) / viewport.scale,
      minX: (-paddingLeft - viewport.x) / viewport.scale,
      minY: (-paddingTop - viewport.y) / viewport.scale,
    };
  };

  const normalizeRect = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): CanvasRect => {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);

    return {
      x,
      y,
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  };

  const getAlignmentGuides = (options?: { excludeBuildingId?: string; excludeRowId?: string }) => {
    const x: number[] = [];
    const y: number[] = [];

    buildings.forEach((building) => {
      if (building.id === options?.excludeBuildingId) {
        return;
      }

      x.push(building.rect.x, building.rect.x + building.rect.width);
      y.push(building.rect.y, building.rect.y + building.rect.height);
    });

    rows.forEach((row) => {
      if (row.id === options?.excludeRowId) {
        return;
      }

      x.push(row.start.x, row.end.x);
      y.push(row.start.y, row.end.y);
    });

    return { x, y };
  };

  const getComponentAlignmentGuides = (options?: { excludeBuildingId?: string; excludeComponentId?: string }) => {
    const x: number[] = [];
    const y: number[] = [];

    buildings.forEach((building) => {
      building.components.forEach((component) => {
        if (building.id === options?.excludeBuildingId && component.id === options?.excludeComponentId) {
          return;
        }

        const absoluteX = building.rect.x + component.rect.x;
        const absoluteY = building.rect.y + component.rect.y;
        x.push(absoluteX, absoluteX + component.rect.width);
        y.push(absoluteY, absoluteY + component.rect.height);
      });
    });

    rows.forEach((row) => {
      x.push(row.start.x, row.end.x);
      y.push(row.start.y, row.end.y);
    });

    return { x, y };
  };

  const snapPointToGuides = (
    point: { x: number; y: number },
    options?: { excludeBuildingId?: string; excludeRowId?: string }
  ) => {
    const guides = getAlignmentGuides(options);
    const snappedX = getSnappedValue(point.x, guides.x);
    const snappedY = getSnappedValue(point.y, guides.y);

    return {
      x: snappedX ?? point.x,
      y: snappedY ?? point.y,
    };
  };

  const snapRectMoveToGuides = (rect: CanvasRect, options?: { excludeBuildingId?: string }) => {
    const guides = getAlignmentGuides(options);
    const offsetX = getSnappedMoveOffset(rect.x, rect.x + rect.width, guides.x);
    const offsetY = getSnappedMoveOffset(rect.y, rect.y + rect.height, guides.y);

    return {
      ...rect,
      x: rect.x + offsetX,
      y: rect.y + offsetY,
    };
  };

  const snapComponentRectMoveToGuides = (
    rect: CanvasRect,
    options?: { excludeBuildingId?: string; excludeComponentId?: string }
  ) => {
    const guides = getComponentAlignmentGuides(options);
    const offsetX = getSnappedMoveOffset(rect.x, rect.x + rect.width, guides.x);
    const offsetY = getSnappedMoveOffset(rect.y, rect.y + rect.height, guides.y);

    return {
      ...rect,
      x: rect.x + offsetX,
      y: rect.y + offsetY,
    };
  };

  const snapRowToGuides = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    options?: { excludeRowId?: string }
  ) => {
    const guides = getAlignmentGuides(options);
    const offsetX = getSnappedMoveOffset(start.x, end.x, guides.x);
    const offsetY = getSnappedMoveOffset(start.y, end.y, guides.y);

    return {
      end: {
        x: end.x + offsetX,
        y: end.y + offsetY,
      },
      start: {
        x: start.x + offsetX,
        y: start.y + offsetY,
      },
    };
  };

  const zoomCanvasAtPoint = (clientX: number, clientY: number, nextScale: number) => {
    const bounds = canvasRef.current?.getBoundingClientRect();

    if (!bounds) {
      return;
    }

    const clampedScale = Math.max(0.35, Math.min(nextScale, 2.5));
    const mouseX = clientX - bounds.left;
    const mouseY = clientY - bounds.top;
    const worldX = (mouseX - viewport.x) / viewport.scale;
    const worldY = (mouseY - viewport.y) / viewport.scale;

    setViewport({
      scale: clampedScale,
      x: mouseX - worldX * clampedScale,
      y: mouseY - worldY * clampedScale,
    });
  };

  const handleCanvasWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
    zoomCanvasAtPoint(event.clientX, event.clientY, viewport.scale * zoomFactor);
  };

  const handleCanvasMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (canvasPan) {
      setViewport({
        ...viewport,
        x: canvasPan.startX + (event.clientX - canvasPan.startClientX),
        y: canvasPan.startY + (event.clientY - canvasPan.startClientY),
      });
      return;
    }

    const point = getCanvasPoint(event.clientX, event.clientY);

    if (!point) {
      return;
    }

    if (buildingLabelDrag) {
      const draggedBuilding = buildings.find((building) => building.id === buildingLabelDrag.buildingId);

      if (!draggedBuilding) {
        return;
      }

      const localPoint = getPointInBuildingLocalSpace(draggedBuilding, point);
      const nextLocalX = Math.max(0, Math.min(localPoint.x - buildingLabelDrag.offsetX, draggedBuilding.rect.width));
      const nextLocalY = Math.max(0, Math.min(localPoint.y - buildingLabelDrag.offsetY, draggedBuilding.rect.height));

      updateBuilding(draggedBuilding.id, (building) => ({
        ...building,
        settings: {
          ...building.settings,
          labelX: (nextLocalX / Math.max(1, building.rect.width)) * 100,
          labelY: (nextLocalY / Math.max(1, building.rect.height)) * 100,
        },
      }));
      return;
    }

    if (buildingComponentResize && canvasRef.current) {
      const editedBuilding = buildings.find((building) => building.id === buildingComponentResize.buildingId);

      if (!editedBuilding) {
        return;
      }

      const minSize = 24;
      const deltaX = point.x - buildingComponentResize.startPoint.x;
      const deltaY = point.y - buildingComponentResize.startPoint.y;
      const nextRect = { ...buildingComponentResize.startRect };
      const guides = getComponentAlignmentGuides({
        excludeBuildingId: buildingComponentResize.buildingId,
        excludeComponentId: buildingComponentResize.componentId,
      });

      if (buildingComponentResize.edge === 'left') {
        const maxX = buildingComponentResize.startRect.x + buildingComponentResize.startRect.width - minSize;
        const rawX = Math.min(buildingComponentResize.startRect.x + deltaX, maxX);
        nextRect.x = (getSnappedValue(rawX, guides.x) ?? rawX);
        nextRect.width = buildingComponentResize.startRect.x + buildingComponentResize.startRect.width - nextRect.x;
      }

      if (buildingComponentResize.edge === 'right') {
        const rawWidth = Math.max(minSize, buildingComponentResize.startRect.width + deltaX);
        const rawRight = buildingComponentResize.startRect.x + rawWidth;
        const snappedRight = getSnappedValue(rawRight, guides.x) ?? rawRight;
        nextRect.width = Math.max(minSize, snappedRight - buildingComponentResize.startRect.x);
      }

      if (buildingComponentResize.edge === 'top') {
        const maxY = buildingComponentResize.startRect.y + buildingComponentResize.startRect.height - minSize;
        const rawY = Math.min(buildingComponentResize.startRect.y + deltaY, maxY);
        nextRect.y = (getSnappedValue(rawY, guides.y) ?? rawY);
        nextRect.height = buildingComponentResize.startRect.y + buildingComponentResize.startRect.height - nextRect.y;
      }

      if (buildingComponentResize.edge === 'bottom') {
        const rawHeight = Math.max(minSize, buildingComponentResize.startRect.height + deltaY);
        const rawBottom = buildingComponentResize.startRect.y + rawHeight;
        const snappedBottom = getSnappedValue(rawBottom, guides.y) ?? rawBottom;
        nextRect.height = Math.max(minSize, snappedBottom - buildingComponentResize.startRect.y);
      }

      const absoluteComponents = getAbsoluteComponentRects(editedBuilding).map((component) =>
        component.id === buildingComponentResize.componentId ? { ...component, rect: nextRect } : component
      );

      updateBuilding(editedBuilding.id, (building) => rebuildBuildingFromAbsoluteComponents(building, absoluteComponents));
      return;
    }

    if (buildingComponentDrag) {
      const editedBuilding = buildings.find((building) => building.id === buildingComponentDrag.buildingId);

      if (!editedBuilding) {
        return;
      }

      const absoluteComponents = getAbsoluteComponentRects(editedBuilding).map((component) =>
        component.id === buildingComponentDrag.componentId
          ? {
              ...component,
              rect: snapComponentRectMoveToGuides({
                ...component.rect,
                x: point.x - buildingComponentDrag.offsetX,
                y: point.y - buildingComponentDrag.offsetY,
              }, {
                excludeBuildingId: buildingComponentDrag.buildingId,
                excludeComponentId: buildingComponentDrag.componentId,
              }),
            }
          : component
      );

      updateBuilding(editedBuilding.id, (building) => rebuildBuildingFromAbsoluteComponents(building, absoluteComponents));
      return;
    }

    if (rowHandleDrag) {
      setRows((current) =>
        current.map((row) =>
          row.id === rowHandleDrag.rowId
            ? {
                ...row,
                [rowHandleDrag.handle]: snapPointToGuides(
                  getSnappedRowPoint(rowHandleDrag.handle === 'start' ? row.end : row.start, point),
                  { excludeRowId: row.id }
                ),
              }
            : row
        )
      );
      return;
    }

    if (rowDrag) {
      const deltaX = point.x - rowDrag.startPoint.x;
      const deltaY = point.y - rowDrag.startPoint.y;
      const snappedRow = snapRowToGuides(
        {
          x: rowDrag.start.x + deltaX,
          y: rowDrag.start.y + deltaY,
        },
        {
          x: rowDrag.end.x + deltaX,
          y: rowDrag.end.y + deltaY,
        },
        { excludeRowId: rowDrag.rowId }
      );

      setRows((current) =>
        current.map((row) =>
          row.id === rowDrag.rowId
            ? {
                ...row,
                start: snappedRow.start,
                end: snappedRow.end,
              }
            : row
        )
      );
      return;
    }

    if (buildingResize && canvasRef.current) {
      const visibleWorldBounds = getVisibleWorldBounds();

      if (!visibleWorldBounds) {
        return;
      }

      const minSize = 24;
      const deltaX = point.x - buildingResize.startPoint.x;
      const deltaY = point.y - buildingResize.startPoint.y;
      const nextRect = { ...buildingResize.startRect };
      const guides = getAlignmentGuides({ excludeBuildingId: buildingResize.buildingId });

      if (buildingResize.edge === 'left') {
        const maxX = buildingResize.startRect.x + buildingResize.startRect.width - minSize;
        const clampedX = Math.max(visibleWorldBounds.minX, Math.min(buildingResize.startRect.x + deltaX, maxX));
        const snappedX = getSnappedValue(clampedX, guides.x) ?? clampedX;
        nextRect.x = snappedX;
        nextRect.width = buildingResize.startRect.x + buildingResize.startRect.width - snappedX;
      }

      if (buildingResize.edge === 'right') {
        const maxWidth = visibleWorldBounds.maxX - buildingResize.startRect.x;
        const rawWidth = Math.max(minSize, Math.min(buildingResize.startRect.width + deltaX, maxWidth));
        const rawRight = buildingResize.startRect.x + rawWidth;
        const snappedRight = getSnappedValue(rawRight, guides.x) ?? rawRight;
        nextRect.width = Math.max(minSize, Math.min(snappedRight - buildingResize.startRect.x, maxWidth));
      }

      if (buildingResize.edge === 'top') {
        const maxY = buildingResize.startRect.y + buildingResize.startRect.height - minSize;
        const clampedY = Math.max(visibleWorldBounds.minY, Math.min(buildingResize.startRect.y + deltaY, maxY));
        const snappedY = getSnappedValue(clampedY, guides.y) ?? clampedY;
        nextRect.y = snappedY;
        nextRect.height = buildingResize.startRect.y + buildingResize.startRect.height - snappedY;
      }

      if (buildingResize.edge === 'bottom') {
        const maxHeight = visibleWorldBounds.maxY - buildingResize.startRect.y;
        const rawHeight = Math.max(minSize, Math.min(buildingResize.startRect.height + deltaY, maxHeight));
        const rawBottom = buildingResize.startRect.y + rawHeight;
        const snappedBottom = getSnappedValue(rawBottom, guides.y) ?? rawBottom;
        nextRect.height = Math.max(minSize, Math.min(snappedBottom - buildingResize.startRect.y, maxHeight));
      }

      updateBuilding(buildingResize.buildingId, (building) => ({
        ...building,
        components: scaleBuildingComponents(building.components, building.rect, nextRect),
        docks: realignDockPlacements(
          building.docks,
          building.rect,
          nextRect,
          scaleBuildingShape(building.shape, building.rect, nextRect)
        ),
        rect: nextRect,
        shape: scaleBuildingShape(building.shape, building.rect, nextRect),
      }));
      return;
    }

    if (isDrawingRow && rowDraftStart) {
      setRowDraftCurrent(snapPointToGuides(getSnappedRowPoint(rowDraftStart, point)));
      return;
    }

    if (buildingDrag && canvasRef.current) {
      const draggedBuilding = buildings.find((building) => building.id === buildingDrag.buildingId);
      const visibleWorldBounds = getVisibleWorldBounds();

      if (!draggedBuilding || !visibleWorldBounds) {
        return;
      }

      const nextX = Math.max(
        visibleWorldBounds.minX,
        Math.min(point.x - buildingDrag.offsetX, visibleWorldBounds.maxX - draggedBuilding.rect.width)
      );
      const nextY = Math.max(
        visibleWorldBounds.minY,
        Math.min(point.y - buildingDrag.offsetY, visibleWorldBounds.maxY - draggedBuilding.rect.height)
      );
      const snappedRect = snapRectMoveToGuides(
        {
          ...draggedBuilding.rect,
          x: nextX,
          y: nextY,
        },
        { excludeBuildingId: draggedBuilding.id }
      );

      updateBuilding(draggedBuilding.id, (building) => ({
        ...building,
        rect: {
          ...building.rect,
          x: Math.max(
            visibleWorldBounds.minX,
            Math.min(snappedRect.x, visibleWorldBounds.maxX - draggedBuilding.rect.width)
          ),
          y: Math.max(
            visibleWorldBounds.minY,
            Math.min(snappedRect.y, visibleWorldBounds.maxY - draggedBuilding.rect.height)
          ),
        },
      }));
      return;
    }

    if (!isDrawingBuilding || !buildingDraftStart) {
      return;
    }

    if (buildingPointerDownRef.current) {
      const movedX = point.x - buildingDraftStart.x;
      const movedY = point.y - buildingDraftStart.y;

      if (Math.abs(movedX) > 2 || Math.abs(movedY) > 2) {
        buildingDragDrawRef.current = true;
      }
    }

    setBuildingDraftCurrent(snapPointToGuides(point));
  };

  const handleCanvasLeave = () => {
    setCanvasPan(null);
    setBuildingDrag(null);
    setBuildingResize(null);
    setBuildingLabelDrag(null);
    setBuildingComponentDrag(null);
    setBuildingComponentResize(null);
    setRowDrag(null);
    setRowHandleDrag(null);
    buildingPointerDownRef.current = false;
    buildingDragDrawRef.current = false;
    if (selectingEdge) {
      setHoverTarget(null);
    }
  };

  const handleCanvasMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    setCanvasPan(null);
    setBuildingDrag(null);
    setBuildingResize(null);
    setBuildingLabelDrag(null);
    setBuildingComponentDrag(null);
    setBuildingComponentResize(null);
    setRowDrag(null);
    setRowHandleDrag(null);

    if (isDrawingBuilding && buildingPointerDownRef.current && buildingDraftStart) {
      const point = getCanvasPoint(event.clientX, event.clientY) ?? buildingDraftCurrent ?? buildingDraftStart;

      if (buildingDragDrawRef.current) {
        const nextRect = normalizeRect(buildingDraftStart, snapPointToGuides(point));
        const nextBuildingId = `building-${idRef.current++}`;

        setBuildings((current) => [
          ...current,
          {
            components: [
              {
                id: `component-${nextBuildingId}-1`,
                rect: { x: 0, y: 0, width: nextRect.width, height: nextRect.height },
              },
            ],
            docks: [],
            id: nextBuildingId,
            rect: nextRect,
            shape: getFullRectShape(nextRect),
            settings: { ...buildingSettings },
          },
        ]);
        setSelection({ buildingId: nextBuildingId, type: 'building' });
        setSelectedBuildingIds([nextBuildingId]);
        setBuildingDraftStart(null);
        setBuildingDraftCurrent(null);
        setIsDrawingBuilding(false);
      }

      buildingPointerDownRef.current = false;
      buildingDragDrawRef.current = false;
      return;
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (skipCanvasClickRef.current) {
      skipCanvasClickRef.current = false;
      return;
    }

    const point = getCanvasPoint(event.clientX, event.clientY);

    if (!point) {
      return;
    }

    if (isDrawingBuilding) {
      if (!buildingDraftStart) {
        setBuildingDraftStart(point);
        setBuildingDraftCurrent(point);
        return;
      }

      const nextRect = normalizeRect(buildingDraftStart, snapPointToGuides(point));
      setBuildings((current) => [
        ...current,
        {
          components: [
            {
              id: `component-building-${idRef.current - 1}-1`,
              rect: { x: 0, y: 0, width: nextRect.width, height: nextRect.height },
            },
          ],
          docks: [],
          id: `building-${idRef.current++}`,
          rect: nextRect,
          shape: getFullRectShape(nextRect),
          settings: { ...buildingSettings },
        },
      ]);
      setSelection({ buildingId: `building-${idRef.current - 1}`, type: 'building' });
      setSelectedBuildingIds([`building-${idRef.current - 1}`]);
      setBuildingDraftStart(null);
      setBuildingDraftCurrent(null);
      setIsDrawingBuilding(false);
      return;
    }

    if (isDrawingRow) {
      if (!rowDraftStart) {
        setRowDraftStart(point);
        setRowDraftCurrent(point);
        return;
      }

      const snappedPoint = snapPointToGuides(getSnappedRowPoint(rowDraftStart, point));

      const nextRowId = `row-${idRef.current++}`;
      setRows((current) => [
        ...current,
        {
          end: snappedPoint,
          id: nextRowId,
          settings: { ...rowSettings },
          start: rowDraftStart,
        },
      ]);
      setSelection({ rowId: nextRowId, type: 'row' });
      setSelectedBuildingIds([]);
      setRowDraftStart(null);
      setRowDraftCurrent(null);
      setIsDrawingRow(false);
      return;
    }

    if (selectingEdge) {
      setHoverTarget(null);
      return;
    }

    setSelection(null);
    setMoveTaskSelectionOverride(null);
    setPullTaskSelectionOverride(null);
    setOperationsTrailerActionModal(null);
    setSelectedBuildingIds([]);
    setEditingCombinedBuildingId(null);
  };

  const handleResizeStart = (event: React.MouseEvent<HTMLButtonElement>, building: BuildingItem, edge: Edge) => {
    if (selectingEdge || isDrawingBuilding || isDrawingRow) {
      return;
    }

    const point = getCanvasPoint(event.clientX, event.clientY);

    if (!point) {
      return;
    }

    event.stopPropagation();
    skipCanvasClickRef.current = true;
    setSelection({ buildingId: building.id, type: 'building' });
    setBuildingDrag(null);
    setBuildingResize({
      buildingId: building.id,
      edge,
      startPoint: point,
      startRect: { ...building.rect },
    });
  };

  const handleBuildingComponentMoveStart = (
    event: React.MouseEvent<HTMLDivElement>,
    building: BuildingItem,
    componentId: string
  ) => {
    if (selectingEdge || isDrawingBuilding || isDrawingRow) {
      return;
    }

    const point = getCanvasPoint(event.clientX, event.clientY);
    const component = getAbsoluteComponentRects(building).find((item) => item.id === componentId);

    if (!point || !component) {
      return;
    }

    event.stopPropagation();
    skipCanvasClickRef.current = true;
    setSelectedBuildingIds([building.id]);
    setSelection({ buildingId: building.id, type: 'building' });
    setBuildingDrag(null);
    setBuildingResize(null);
    setBuildingComponentResize(null);
    setBuildingComponentDrag({
      buildingId: building.id,
      componentId,
      offsetX: point.x - component.rect.x,
      offsetY: point.y - component.rect.y,
    });
  };

  const handleBuildingComponentResizeStart = (
    event: React.MouseEvent<HTMLButtonElement>,
    building: BuildingItem,
    componentId: string,
    edge: Edge
  ) => {
    if (selectingEdge || isDrawingBuilding || isDrawingRow) {
      return;
    }

    const point = getCanvasPoint(event.clientX, event.clientY);
    const component = getAbsoluteComponentRects(building).find((item) => item.id === componentId);

    if (!point || !component) {
      return;
    }

    event.stopPropagation();
    skipCanvasClickRef.current = true;
    setSelectedBuildingIds([building.id]);
    setSelection({ buildingId: building.id, type: 'building' });
    setBuildingDrag(null);
    setBuildingResize(null);
    setBuildingComponentDrag(null);
    setBuildingComponentResize({
      buildingId: building.id,
      componentId,
      edge,
      startPoint: point,
      startRect: component.rect,
    });
  };

  const handleRowMoveStart = (event: React.MouseEvent<HTMLDivElement>, row: ParkingRow) => {
    if (selectingEdge || isDrawingBuilding || isDrawingRow) {
      return;
    }

    const point = getCanvasPoint(event.clientX, event.clientY);

    if (!point) {
      return;
    }

    event.stopPropagation();
    setSelection({ rowId: row.id, type: 'row' });
    setSelectedBuildingIds([]);
    setEditingCombinedBuildingId(null);
    setBuildingDrag(null);
    setBuildingResize(null);
    setRowHandleDrag(null);
    setRowDrag({
      rowId: row.id,
      start: { ...row.start },
      end: { ...row.end },
      startPoint: point,
    });
  };

  const handleRowHandleStart = (
    event: React.MouseEvent<HTMLButtonElement>,
    row: ParkingRow,
    handle: 'start' | 'end'
  ) => {
    if (selectingEdge || isDrawingBuilding || isDrawingRow) {
      return;
    }

    event.stopPropagation();
    setSelection({ rowId: row.id, type: 'row' });
    setSelectedBuildingIds([]);
    setBuildingDrag(null);
    setBuildingResize(null);
    setRowDrag(null);
    setRowHandleDrag({
      handle,
      rowId: row.id,
    });
  };

  const handleBuildingSelection = (buildingId: string, shiftKey: boolean) => {
    if (shiftKey) {
      setSelection(null);
      setEditingCombinedBuildingId(null);
      setSelectedBuildingIds((current) => {
        const next = current.includes(buildingId)
          ? current.filter((id) => id !== buildingId)
          : [...current, buildingId];

        if (next.length === 1) {
          setSelection({ buildingId: next[0], type: 'building' });
        }

        return next;
      });
      return;
    }

    setSelectedBuildingIds([buildingId]);
    setSelection({ buildingId, type: 'building' });
    setEditingCombinedBuildingId(null);
  };

  const handleCombineBuildings = () => {
    if (selectedBuildingIds.length < 2) {
      return;
    }

    const buildingsToCombine = buildings.filter((building) => selectedBuildingIds.includes(building.id));

    if (buildingsToCombine.length < 2) {
      return;
    }

    const absoluteComponents = buildingsToCombine.flatMap((building) => getAbsoluteComponentRects(building));
    const union = buildUnionShape(absoluteComponents.map((component) => component.rect));
    const nextBuildingId = `building-${idRef.current++}`;
    const primaryBuilding = buildingsToCombine[0];

    setBuildings((current) => [
      ...current.filter((building) => !selectedBuildingIds.includes(building.id)),
      {
        components: absoluteComponents.map((component, index) => ({
          id: `component-${nextBuildingId}-${index + 1}`,
          rect: {
            x: component.rect.x - union.rect.x,
            y: component.rect.y - union.rect.y,
            width: component.rect.width,
            height: component.rect.height,
          },
        })),
        docks: buildingsToCombine.flatMap((building) => building.docks),
        id: nextBuildingId,
        rect: union.rect,
        shape: union.shape,
        settings: {
          angle: primaryBuilding.settings.angle,
          color: primaryBuilding.settings.color,
          labelX: primaryBuilding.settings.labelX,
          labelY: primaryBuilding.settings.labelY,
          name: primaryBuilding.settings.name,
        },
      },
    ]);
    setSelectedBuildingIds([nextBuildingId]);
    setSelection({ buildingId: nextBuildingId, type: 'building' });
    setEditingCombinedBuildingId(null);
  };

  const handleRecreateMockTrailerData = () => {
    if (appMode !== 'operations') {
      return;
    }

    setOperationsTrailerActionModal(null);
    setMoveTaskSelectionOverride(null);
    setPullTaskSelectionOverride(null);
    setSelection(null);
    setDockDragHover(null);
    setRemoteCanvasDropHover(null);
    setHoveredRemoteCanvasButtonId(null);
    setIsMoveTaskPopoverHovered(false);

    // If the user hit this mid-drag, cancel the interaction states so the UI is consistent.
    setSpaceDrag(null);
    setDragPreviewEdge(null);
    setDragPreviewAngleOverride(null);
    setDragReturnPreview(null);

    const rng = createSeededRng(Math.floor(Math.random() * 1_000_000_000));
    let nextTrailerIndex = 1 + Math.floor(rng() * 100000);

    const canvasIdsToClearPreview = new Set<string>([activeCanvasId, ...remoteCanvasSnapshots.map((s) => s.id)]);

    // Generate active + all remote canvases with globally-unique trailer numbers.
    const activeResult = buildRandomOperationsAssignments(
      buildings,
      rows,
      dockDoorEnabledBySpaceKey,
      nextTrailerIndex,
      rng
    );
    nextTrailerIndex = activeResult.nextTrailerIndex;

    const nextRemoteSnapshots = remoteCanvasSnapshots.map((snapshot) => {
      const remoteResult = buildRandomOperationsAssignments(
        snapshot.buildings,
        snapshot.rows,
        snapshot.dockDoorEnabledBySpaceKey ?? {},
        nextTrailerIndex,
        rng
      );
      nextTrailerIndex = remoteResult.nextTrailerIndex;

      return {
        ...snapshot,
        operationsAssignments: applyDockDoorBindingsToAssignments(remoteResult.assignments, snapshot.dockDoorEnabledBySpaceKey ?? {}),
      };
    });

    setCanvasPreviewsById((current) => {
      const next = { ...current };
      canvasIdsToClearPreview.forEach((id) => {
        delete next[id];
      });
      return next;
    });

    setOperationsAssignments(applyDockDoorBindingsToAssignments(activeResult.assignments, dockDoorEnabledBySpaceKey));
    setRemoteCanvasSnapshots(nextRemoteSnapshots);
    setAutoSelectSpaceKeyByCanvasId({});
    setRemoteCanvasDropHover(null);
  };

  const handleBuildingLabelDragStart = (event: React.MouseEvent<HTMLSpanElement>, building: BuildingItem) => {
    if (selectingEdge || isDrawingBuilding || isDrawingRow) {
      return;
    }

    const point = getCanvasPoint(event.clientX, event.clientY);

    if (!point) {
      return;
    }

    const localPoint = getPointInBuildingLocalSpace(building, point);
    const labelLocalX = (building.settings.labelX / 100) * building.rect.width;
    const labelLocalY = (building.settings.labelY / 100) * building.rect.height;

    event.stopPropagation();
    skipCanvasClickRef.current = true;
    setSelectedBuildingIds([building.id]);
    setSelection({ buildingId: building.id, type: 'building' });
    setBuildingDrag(null);
    setBuildingResize(null);
    setBuildingLabelDrag({
      buildingId: building.id,
      offsetX: localPoint.x - labelLocalX,
      offsetY: localPoint.y - labelLocalY,
    });
  };

  const handleAddDock = () => {
    if (appMode !== 'build') {
      return;
    }

    if (buildings.length === 0) {
      return;
    }

    setEditingCombinedBuildingId(null);
    setSelectingEdge(true);
    setAddMenuOpen(false);
  };

  const handleCreateBindings = () => {
    if (appMode !== 'build' || selection?.type !== 'dock' || !selectedBuilding || !selectedDock) {
      return;
    }

    const draft: Record<string, boolean> = {};
    getDockNumbers(selectedDock.settings).forEach((slotLabel) => {
      const spaceKey = getDockSpaceKey(selectedBuilding.id, selectedDock.id, slotLabel);
      draft[spaceKey] = dockDoorEnabledBySpaceKey[spaceKey] !== false;
    });
    setDockBindingsDraft(draft);
    setIsDockBindingsModalOpen(true);
  };

  const handleDockBindingToggle = (spaceKey: string, enabled: boolean) => {
    setDockBindingsDraft((current) => ({ ...current, [spaceKey]: enabled }));
  };

  const handleDockBindingsCancel = () => {
    setIsDockBindingsModalOpen(false);
    setDockBindingsDraft({});
  };

  const handleDockBindingsApply = () => {
    setDockDoorEnabledBySpaceKey((current) => ({ ...current, ...dockBindingsDraft }));
    setIsDockBindingsModalOpen(false);
    setDockBindingsDraft({});
  };

  const handleSpaceDragStart = (
    spaceKey: string,
    sourceEdge: Edge,
    sourceAngle: number,
    pointer: { x: number; y: number }
  ) => {
    const assignment = operationsAssignments[spaceKey];

    if (
      appMode !== 'operations' ||
      !assignment?.trailer ||
      !(
        (assignment.type === 'yard' &&
          assignment.state !== 'move-task' &&
          assignment.state !== 'pull-task') ||
        (assignment.type === 'yard' && assignment.state === 'move-task' && assignment.remoteMoveTaskRole === 'destination') ||
        (assignment.type === 'dock' && (assignment.state === 'move-task' || assignment.state === 'issue'))
      )
    ) {
      return false;
    }

    // If a click-action modal is open, starting a drag should close it.
    setOperationsTrailerActionModal(null);

    setSpaceDrag({ pointerX: pointer.x, pointerY: pointer.y, sourceAngle, sourceSpaceKey: spaceKey });
    setDragPreviewEdge(sourceEdge);
    setDragPreviewFollowsSourceAngle(true);
    setDragPreviewAngleOverride(null);
    dropSucceededRef.current = false;
    return true;
  };

  const handleSpaceDragEnd = () => {
    transparentDragImageRef.current?.remove();
    transparentDragImageRef.current = null;

    if (!dropSucceededRef.current && spaceDrag && dragPreviewAssignment && dragPreviewEdge) {
      const sourceNode = spaceRefs.current[spaceDrag.sourceSpaceKey];
      const sourceBounds = sourceNode?.getBoundingClientRect();

      if (sourceBounds) {
        const dragPreviewAngle =
          dragPreviewFollowsSourceAngle ? spaceDrag.sourceAngle : dragPreviewAngleOverride ?? 0;
        setDragReturnActive(false);
        setDragReturnPreview({
          assignment: dragPreviewAssignment,
          edge: dragPreviewEdge,
          fromX: spaceDrag.pointerX,
          fromY: spaceDrag.pointerY,
          sourceAngle: dragPreviewAngle,
          toX: sourceBounds.left + sourceBounds.width / 2,
          toY: sourceBounds.top + sourceBounds.height / 2,
        });
      }
    }

    dropSucceededRef.current = false;
    setDockDragHover(null);
    setDragPreviewEdge(null);
    setDragPreviewFollowsSourceAngle(true);
    setDragPreviewAngleOverride(null);
    setSpaceDrag(null);
  };

  const setSpaceDragPreview = (event: React.DragEvent<HTMLDivElement>) => {
    const transparentNode = document.createElement('div');

    transparentDragImageRef.current?.remove();
    transparentDragImageRef.current = transparentNode;

    transparentNode.style.position = 'fixed';
    transparentNode.style.top = '-10000px';
    transparentNode.style.left = '-10000px';
    transparentNode.style.width = '1px';
    transparentNode.style.height = '1px';
    transparentNode.style.opacity = '0';
    transparentNode.style.pointerEvents = 'none';

    document.body.appendChild(transparentNode);
    event.dataTransfer.setDragImage(transparentNode, 0, 0);
  };

  const handleSpaceDragMove = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.clientX === 0 && event.clientY === 0) {
      return;
    }

    setSpaceDrag((current) =>
      current
        ? {
            ...current,
            pointerX: event.clientX,
            pointerY: event.clientY,
          }
        : current
    );
  };

  const handleSpaceDrop = (targetSpaceKey: string) => {
    const sourceSpaceKey = spaceDrag?.sourceSpaceKey;
    const sourceAssignment = sourceSpaceKey ? operationsAssignments[sourceSpaceKey] : null;
    const targetAssignment = operationsAssignments[targetSpaceKey];
    const sourceIsNewMoveTask =
      sourceAssignment?.type === 'yard' && sourceAssignment.state !== 'move-task' && Boolean(sourceAssignment.trailer);
    const sourceIsCompleteDockToYard =
      sourceAssignment?.type === 'dock' && sourceAssignment.state === 'issue' && Boolean(sourceAssignment.trailer);
    const sourceIsYardDestinationReassign =
      sourceAssignment?.type === 'yard' &&
      sourceAssignment.state === 'move-task' &&
      sourceAssignment.remoteMoveTaskRole === 'destination' &&
      Boolean(sourceAssignment.trailer);
    const sourceIsDockReassign =
      sourceAssignment?.type === 'dock' && sourceAssignment.state === 'move-task' && Boolean(sourceAssignment.trailer);

    const isValidDockTarget =
      targetAssignment?.type === 'dock' && targetAssignment.state === 'default';
    const isValidYardTarget =
      targetAssignment?.type === 'yard' && targetAssignment.state === 'default';

    const isDockDropAllowed =
      isValidDockTarget && (sourceIsNewMoveTask || sourceIsYardDestinationReassign || sourceIsDockReassign);
    const isCompleteDockToYardDropAllowed = isValidYardTarget && Boolean(sourceIsCompleteDockToYard);

    if (
      !sourceSpaceKey ||
      sourceSpaceKey === targetSpaceKey ||
      !sourceAssignment?.trailer ||
      (!isDockDropAllowed && !isCompleteDockToYardDropAllowed) ||
      !targetAssignment ||
      !(
        (targetAssignment.type === 'dock' && targetAssignment.state === 'default') ||
        (targetAssignment.type === 'yard' && targetAssignment.state === 'default')
      )
    ) {
      setDockDragHover(null);
      setDragPreviewEdge(null);
      setDragPreviewAngleOverride(null);
      setSpaceDrag(null);
      return;
    }

    setOperationsAssignments((current) => {
      const nextSourceAssignment = current[sourceSpaceKey];
      const nextTargetAssignment = current[targetSpaceKey];

      if (!nextSourceAssignment?.trailer || !nextTargetAssignment || nextTargetAssignment.state !== 'default') {
        return current;
      }

      const isAllowedDockDrop =
        nextTargetAssignment.type === 'dock' &&
        ((nextSourceAssignment.type === 'yard' && nextSourceAssignment.state !== 'move-task') ||
          (nextSourceAssignment.type === 'yard' &&
            nextSourceAssignment.state === 'move-task' &&
            nextSourceAssignment.remoteMoveTaskRole === 'destination') ||
          (nextSourceAssignment.type === 'dock' && nextSourceAssignment.state === 'move-task'));

      const isAllowedCompleteDockToYardDrop =
        nextTargetAssignment.type === 'yard' &&
        nextSourceAssignment.type === 'dock' &&
        nextSourceAssignment.state === 'issue';

      if (!isAllowedDockDrop && !isAllowedCompleteDockToYardDrop) {
        return current;
      }

      if (
        nextSourceAssignment.type === 'dock' &&
        nextSourceAssignment.state === 'issue' &&
        nextTargetAssignment.type === 'yard'
      ) {
        return {
          ...current,
          [sourceSpaceKey]: {
            ...nextSourceAssignment,
            state: 'pull-task',
            remoteMoveTaskRole: 'source',
          },
          [targetSpaceKey]: {
            ...nextTargetAssignment,
            state: 'pull-task',
            trailer: nextSourceAssignment.trailer,
            remoteMoveTaskRole: 'destination',
          },
        };
      }

      if (nextSourceAssignment.type === 'yard') {
        const isRemoteDestinationYard =
          nextSourceAssignment.state === 'move-task' && nextSourceAssignment.remoteMoveTaskRole === 'destination';

        if (isRemoteDestinationYard) {
          // Reassign the remote destination from the yard into a real dock.
          return {
            ...current,
            [sourceSpaceKey]: {
              ...nextSourceAssignment,
              state: 'default',
              trailer: null,
              remoteMoveTaskRole: undefined,
            },
            [targetSpaceKey]: {
              ...nextTargetAssignment,
              state: 'move-task',
              trailer: nextSourceAssignment.trailer,
              remoteMoveTaskRole: 'destination',
            },
          };
        }

        // Normal move creation: vacate the yard and assign a new dock destination.
        return {
          ...current,
          [sourceSpaceKey]: {
            ...nextSourceAssignment,
            state: 'move-task',
            remoteMoveTaskRole: 'source',
          },
          [targetSpaceKey]: {
            ...nextTargetAssignment,
            state: 'move-task',
            trailer: nextSourceAssignment.trailer,
            remoteMoveTaskRole: 'destination',
          },
        };
      }

      const remoteRoleToPreserve = nextSourceAssignment.remoteMoveTaskRole === 'destination' ? 'destination' : undefined;
      return {
        ...current,
        [sourceSpaceKey]: {
          ...nextSourceAssignment,
          state: 'default',
          trailer: null,
          remoteMoveTaskRole: undefined,
        },
        [targetSpaceKey]: {
          ...nextTargetAssignment,
          state: 'move-task',
          trailer: nextSourceAssignment.trailer,
          remoteMoveTaskRole: remoteRoleToPreserve,
        },
      };
    });
    // Ensure we select the correct connection line type after drag/drop.
    if (isCompleteDockToYardDropAllowed) {
      setMoveTaskSelectionOverride(null);
      setPullTaskSelectionOverride(sourceAssignment.trailer.trailerNumber);
    } else {
      setPullTaskSelectionOverride(null);
      setMoveTaskSelectionOverride(sourceAssignment.trailer.trailerNumber);
    }
    skipNextSpaceSelectClearRef.current = true;
    setSelection({ spaceKey: targetSpaceKey, type: 'space' });
    dropSucceededRef.current = true;
    setDockDragHover(null);
    setDragPreviewEdge(null);
    setDragPreviewFollowsSourceAngle(true);
    setDragPreviewAngleOverride(null);
    setSpaceDrag(null);
  };

  const handleSpaceSelect = (spaceKey: string) => {
    const assignment = operationsAssignments[spaceKey];

    if (skipNextSpaceSelectClearRef.current) {
      skipNextSpaceSelectClearRef.current = false;
    } else {
      const trailerNumber = assignment?.trailer?.trailerNumber ?? null;
      if (assignment?.state === 'move-task' && trailerNumber) {
        setMoveTaskSelectionOverride(trailerNumber);
      } else {
        setMoveTaskSelectionOverride(null);
      }

      if (assignment?.state === 'pull-task' && trailerNumber) {
        setPullTaskSelectionOverride(trailerNumber);
      } else {
        setPullTaskSelectionOverride(null);
      }
    }

    setSelection({ spaceKey, type: 'space' });

    if (appMode === 'operations' && assignment?.trailer) {
      const trailerNumber = assignment.trailer.trailerNumber;
      const carrierName = assignment.trailer.carrierName;
      const isDestinationMoveTask = assignment.state === 'move-task' && assignment.remoteMoveTaskRole === 'destination';
      const isDestinationPullTask = assignment.state === 'pull-task' && assignment.remoteMoveTaskRole === 'destination';
      const isSourcePullTask = assignment.state === 'pull-task' && assignment.remoteMoveTaskRole === 'source';
      const isParkingWithNoMoveTask =
        assignment.type === 'yard' && assignment.state !== 'move-task' && assignment.state !== 'pull-task';

      if (isDestinationMoveTask || isDestinationPullTask || isSourcePullTask || isParkingWithNoMoveTask) {
        setOperationsTrailerActionModal({
          action: isDestinationMoveTask
            ? 'complete_move'
            : isDestinationPullTask
              ? 'complete_pull'
              : isSourcePullTask
                ? 'cancel_pull'
                : 'check_out',
          spaceKey,
          trailerNumber,
          carrierName,
        });
      } else {
        setOperationsTrailerActionModal(null);
      }
    }
  };

  const resolveCancelledMoveTaskAssignments = (
    assignments: OperationsAssignments,
    trailerNumber: string
  ): OperationsAssignments => {
    const matching = Object.values(assignments).filter(
      (assignment) => assignment.state === 'move-task' && assignment.trailer?.trailerNumber === trailerNumber
    );

    if (matching.length === 0) {
      return assignments;
    }

    const next: OperationsAssignments = { ...assignments };
    const hasExplicitDestination = matching.some((assignment) => assignment.remoteMoveTaskRole === 'destination');

    if (hasExplicitDestination) {
      const destinationIsYard = matching.some(
        (assignment) => assignment.remoteMoveTaskRole === 'destination' && assignment.type === 'yard'
      );

      matching.forEach((assignment) => {
        if (assignment.remoteMoveTaskRole === 'destination') {
          next[assignment.key] = {
            ...assignment,
            state: 'default',
            trailer: null,
            remoteMoveTaskRole: undefined,
          };
          return;
        }

        next[assignment.key] =
          assignment.type === 'yard'
            ? {
                ...assignment,
                state: 'occupied',
                remoteMoveTaskRole: undefined,
              }
            : destinationIsYard
              ? {
                  ...assignment,
                  state: 'issue',
                  remoteMoveTaskRole: undefined,
                }
              : {
                  ...assignment,
                  state: 'default',
                  trailer: null,
                  remoteMoveTaskRole: undefined,
                };
      });

      return next;
    }

    // No explicit source/destination role (e.g. local move-task or bindings changed after creation).
    // Keep exactly one assignment with the trailer and clear all other duplicates.
    const rowBacked = matching.find((assignment) => assignment.key.startsWith('row:'));
    const sourceRole = matching.find((assignment) => assignment.remoteMoveTaskRole === 'source');
    // For local moves that start from a converted dock (yard), the yard copy is the "source".
    // Keeping the dock destination here would make cancel look like completion.
    const yardBacked = matching.find((assignment) => assignment.type === 'yard');
    const keeper = yardBacked ?? rowBacked ?? sourceRole ?? matching[0];

    matching.forEach((assignment) => {
      if (assignment.key === keeper.key) {
        next[assignment.key] =
          assignment.type === 'yard'
            ? {
                ...assignment,
                state: 'occupied',
                remoteMoveTaskRole: undefined,
              }
            : {
                ...assignment,
                state: 'in-progress',
                remoteMoveTaskRole: undefined,
              };
        return;
      }

      next[assignment.key] = {
        ...assignment,
        state: 'default',
        trailer: null,
        remoteMoveTaskRole: undefined,
      };
    });

    return next;
  };

  const handleCancelMoveTask = (trailerNumber: string) => {
    setOperationsAssignments((current) => resolveCancelledMoveTaskAssignments(current, trailerNumber));

    // Also revert the other canvas when this trailer's move spans multiple canvases.
    setRemoteCanvasSnapshots((current) =>
      current.map((snapshot) => {
        const nextOps = resolveCancelledMoveTaskAssignments(snapshot.operationsAssignments, trailerNumber);
        return nextOps === snapshot.operationsAssignments ? snapshot : { ...snapshot, operationsAssignments: nextOps };
      })
    );

    if (selection?.type === 'space') {
      const selectedAssignment = operationsAssignments[selection.spaceKey];

      if (selectedAssignment?.trailer?.trailerNumber === trailerNumber) {
        setSelection({ spaceKey: selection.spaceKey, type: 'space' });
      }
    }

    setMoveTaskSelectionOverride(null);
  };

  const handleCompleteMoveFromDestinationModal = () => {
    if (!operationsTrailerActionModal || operationsTrailerActionModal.action !== 'complete_move') {
      return;
    }

    const { spaceKey: destinationSpaceKey, trailerNumber } = operationsTrailerActionModal;
    const destinationType = operationsAssignments[destinationSpaceKey]?.type;

    setOperationsAssignments((current) => {
      const next: OperationsAssignments = { ...current };

      Object.entries(current).forEach(([key, assignment]) => {
        if (assignment.trailer?.trailerNumber !== trailerNumber) {
          return;
        }

        if (key === destinationSpaceKey) {
          next[key] = {
            ...assignment,
            state: destinationType === 'yard' ? 'occupied' : 'in-progress',
            remoteMoveTaskRole: undefined,
          };
          return;
        }

        // Clear the source copy. For dock destinations, the source is the yard.
        // For yard destinations, the source is a dock.
        if (destinationType === 'yard' || assignment.type === 'yard') {
          next[key] = {
            ...assignment,
            state: 'default',
            trailer: null,
            remoteMoveTaskRole: undefined,
          };
        }
      });

      return next;
    });

    // Remove the yard (parking) copy from the other canvas.
    setRemoteCanvasSnapshots((current) =>
      current.map((snapshot) => {
        let didChange = false;
        const nextOps: OperationsAssignments = { ...snapshot.operationsAssignments };

        Object.entries(snapshot.operationsAssignments).forEach(([key, assignment]) => {
          if (assignment.trailer?.trailerNumber !== trailerNumber) {
            return;
          }

          if (destinationType !== 'yard' && assignment.type !== 'yard') {
            return;
          }

          didChange = true;
          nextOps[key] = {
            ...assignment,
            state: 'default',
            trailer: null,
            remoteMoveTaskRole: undefined,
          };
        });

        return didChange ? { ...snapshot, operationsAssignments: nextOps } : snapshot;
      })
    );

    setOperationsTrailerActionModal(null);
    setMoveTaskSelectionOverride(null);
    setPullTaskSelectionOverride(null);
  };

  const handleCompletePullFromDestinationModal = () => {
    if (!operationsTrailerActionModal || operationsTrailerActionModal.action !== 'complete_pull') {
      return;
    }

    const { spaceKey: destinationSpaceKey, trailerNumber } = operationsTrailerActionModal;
    const destinationType = operationsAssignments[destinationSpaceKey]?.type;

    setOperationsAssignments((current) => {
      const next: OperationsAssignments = { ...current };

      Object.entries(current).forEach(([key, assignment]) => {
        if (assignment.trailer?.trailerNumber !== trailerNumber) {
          return;
        }

        if (key === destinationSpaceKey) {
          next[key] = {
            ...assignment,
            // Yard destination becomes a normal occupied yard slot.
            state: destinationType === 'yard' ? 'occupied' : 'occupied',
            remoteMoveTaskRole: undefined,
          };
          return;
        }

        // Clear the source copy. For pull tasks, the source is the dock copy.
        if (assignment.type === 'dock') {
          next[key] = {
            ...assignment,
            state: 'default',
            trailer: null,
            remoteMoveTaskRole: undefined,
          };
        }
      });

      return next;
    });

    // Remove the dock (source) copy from other canvases.
    setRemoteCanvasSnapshots((current) =>
      current.map((snapshot) => {
        let didChange = false;
        const nextOps: OperationsAssignments = { ...snapshot.operationsAssignments };

        Object.entries(snapshot.operationsAssignments).forEach(([key, assignment]) => {
          if (assignment.trailer?.trailerNumber !== trailerNumber) {
            return;
          }

          if (assignment.type !== 'dock') {
            return;
          }

          didChange = true;
          nextOps[key] = {
            ...assignment,
            state: 'default',
            trailer: null,
            remoteMoveTaskRole: undefined,
          };
        });

        return didChange ? { ...snapshot, operationsAssignments: nextOps } : snapshot;
      })
    );

    setOperationsTrailerActionModal(null);
    setMoveTaskSelectionOverride(null);
    setPullTaskSelectionOverride(null);
  };

  const handleCancelPullFromSourceModal = () => {
    if (!operationsTrailerActionModal || operationsTrailerActionModal.action !== 'cancel_pull') {
      return;
    }

    const { spaceKey: sourceSpaceKey, trailerNumber } = operationsTrailerActionModal;

    setOperationsAssignments((current) => {
      const next: OperationsAssignments = { ...current };

      Object.entries(current).forEach(([key, assignment]) => {
        if (assignment.trailer?.trailerNumber !== trailerNumber) {
          return;
        }

        if (key === sourceSpaceKey) {
          // Restore dock to "issue" (completed).
          next[key] = {
            ...assignment,
            state: 'issue',
            remoteMoveTaskRole: undefined,
          };
          return;
        }

        // Clear the destination (yard) copy.
        if (assignment.type === 'yard') {
          next[key] = {
            ...assignment,
            state: 'default',
            trailer: null,
            remoteMoveTaskRole: undefined,
          };
        }
      });

      return next;
    });

    // Remove the yard (destination) copy from other canvases.
    setRemoteCanvasSnapshots((current) =>
      current.map((snapshot) => {
        let didChange = false;
        const nextOps: OperationsAssignments = { ...snapshot.operationsAssignments };

        Object.entries(snapshot.operationsAssignments).forEach(([key, assignment]) => {
          if (assignment.trailer?.trailerNumber !== trailerNumber) {
            return;
          }

          if (assignment.type !== 'yard') {
            return;
          }

          didChange = true;
          nextOps[key] = {
            ...assignment,
            state: 'default',
            trailer: null,
            remoteMoveTaskRole: undefined,
          };
        });

        return didChange ? { ...snapshot, operationsAssignments: nextOps } : snapshot;
      })
    );

    setOperationsTrailerActionModal(null);
    setMoveTaskSelectionOverride(null);
    setPullTaskSelectionOverride(null);
  };

  const handleCheckOutFromParkingModal = () => {
    if (!operationsTrailerActionModal || operationsTrailerActionModal.action !== 'check_out') {
      return;
    }

    const { spaceKey } = operationsTrailerActionModal;

    setOperationsAssignments((current) => {
      const assignment = current[spaceKey];
      if (!assignment || !assignment.trailer) {
        return current;
      }

      return {
        ...current,
        [spaceKey]: {
          ...assignment,
          state: 'default',
          trailer: null,
          remoteMoveTaskRole: undefined,
        },
      };
    });

    setOperationsTrailerActionModal(null);
    setMoveTaskSelectionOverride(null);
    setPullTaskSelectionOverride(null);
  };

  const handleDockAvailabilityToggle = (spaceKey: string, nextState: 'default' | 'blocked') => {
    setOperationsAssignments((current) => {
      const assignment = current[spaceKey];

      if (!assignment || assignment.type !== 'dock') {
        return current;
      }

      return {
        ...current,
        [spaceKey]: {
          ...assignment,
          state: nextState,
          trailer: nextState === 'blocked' ? null : assignment.trailer,
        },
      };
    });
  };

  const handleEndSession = (spaceKey: string) => {
    setOperationsAssignments((current) => {
      const assignment = current[spaceKey];

      if (!assignment || assignment.state !== 'in-progress') {
        return current;
      }

      if (!assignment.trailer) {
        return current;
      }

      const trailer = assignment.trailer;
      const isEmpty =
        typeof trailer.isEmpty === 'boolean'
          ? trailer.isEmpty
          : (() => {
              const match = trailer.trailerNumber.match(/\d+/);
              const number = match ? Number.parseInt(match[0], 10) : 0;
              return number % 2 === 0;
            })();

      return {
        ...current,
        [spaceKey]: {
          ...assignment,
          state: 'issue',
          trailer: {
            ...trailer,
            isEmpty: !isEmpty, // Flip empty/full when marking complete.
          },
        },
      };
    });
  };

  const handleEdgeSelect = (buildingId: string, anchor: DockAnchor) => {
    if (!selectingEdge) {
      return;
    }

    setBuildings((current) =>
      current.map((building) =>
        building.id === buildingId
          ? {
              ...building,
              docks: [
                ...building.docks,
                {
                  anchor,
                  edge: anchor.edge,
                  id: `dock-${idRef.current}`,
                  settings: { ...dockSettings },
                },
              ],
            }
          : building
      )
    );
    setSelection({ buildingId, dockId: `dock-${idRef.current++}`, type: 'dock' });
    setSelectedBuildingIds([]);
    setEditingCombinedBuildingId(null);
    setHoverTarget(null);
    setSelectingEdge(false);
  };

  const setHoveredSpaceKeyWithGrace = (nextKey: string | null) => {
    if (hoverClearTimeoutRef.current) {
      window.clearTimeout(hoverClearTimeoutRef.current);
      hoverClearTimeoutRef.current = null;
    }

    setHoveredSpaceKey(nextKey);
  };

  const scheduleClearHoveredSpaceKey = (spaceKey: string) => {
    if (hoverClearTimeoutRef.current) {
      window.clearTimeout(hoverClearTimeoutRef.current);
    }

    // Give the user enough time to move from the hovered slot to the popover.
    hoverClearTimeoutRef.current = window.setTimeout(() => {
      setHoveredSpaceKey((current) => (current === spaceKey ? null : current));
      hoverClearTimeoutRef.current = null;
    }, 120);
  };

  const selectedBuilding =
    selection?.type === 'building' || selection?.type === 'dock'
      ? buildings.find((building) => building.id === selection.buildingId) ?? null
      : null;
  const selectedDock =
    selection?.type === 'dock'
      ? selectedBuilding?.docks.find((dock) => dock.id === selection.dockId) ?? null
      : null;
  const dockBindingEntries =
    selection?.type === 'dock' && selectedBuilding && selectedDock
      ? getDockNumbers(selectedDock.settings).map((slotLabel) => {
          const spaceKey = getDockSpaceKey(selectedBuilding.id, selectedDock.id, slotLabel);
          return {
            enabled:
              (isDockBindingsModalOpen ? dockBindingsDraft[spaceKey] : dockDoorEnabledBySpaceKey[spaceKey]) !== false,
            slotLabel,
            spaceKey,
          };
        })
      : [];
  const selectedRow = selection?.type === 'row' ? rows.find((row) => row.id === selection.rowId) ?? null : null;
  const selectedSpaceAssignment =
    selection?.type === 'space' ? operationsAssignments[selection.spaceKey] ?? null : null;
  const selectedMoveTaskTrailerNumber =
    moveTaskSelectionOverride ??
    (selection?.type === 'space' && selectedSpaceAssignment?.state === 'move-task'
      ? selectedSpaceAssignment.trailer?.trailerNumber ?? null
      : null);
  const selectedPullTaskTrailerNumber =
    pullTaskSelectionOverride ??
    (selection?.type === 'space' && selectedSpaceAssignment?.state === 'pull-task'
      ? selectedSpaceAssignment.trailer?.trailerNumber ?? null
      : null);
  const selectedMoveTaskAssignments =
    selectedMoveTaskTrailerNumber === null
      ? []
      : Object.values(operationsAssignments).filter(
          (assignment) =>
            assignment.state === 'move-task' && assignment.trailer?.trailerNumber === selectedMoveTaskTrailerNumber
        );
  const selectedPullTaskAssignments =
    selectedPullTaskTrailerNumber === null
      ? []
      : Object.values(operationsAssignments).filter(
          (assignment) =>
            assignment.state === 'pull-task' && assignment.trailer?.trailerNumber === selectedPullTaskTrailerNumber
        );
  const hasRemoteMoveTaskMatch =
    selectedMoveTaskTrailerNumber !== null &&
    selectedMoveTaskAssignments.length === 1 &&
    remoteCanvasSnapshots.some((snapshot) =>
      Object.values(snapshot.operationsAssignments).some(
        (assignment) =>
          assignment.state === 'move-task' && assignment.trailer?.trailerNumber === selectedMoveTaskTrailerNumber
      )
    );

  const shouldHideMoveIndicators = selectedMoveTaskAssignments.length >= 2 || hasRemoteMoveTaskMatch;
  const selectedMoveTaskSpaceKeys = shouldHideMoveIndicators
    ? new Set(selectedMoveTaskAssignments.map((assignment) => assignment.key))
    : new Set<string>();
  const draggedSpaceKey = spaceDrag?.sourceSpaceKey ?? null;
  const dragPreviewAssignment =
    spaceDrag && appMode === 'operations' ? operationsAssignments[spaceDrag.sourceSpaceKey] ?? null : null;

  const dockSuggestionBySpaceKey: Record<string, DockSuggestionTier> = (() => {
    if (appMode !== 'operations' || !spaceDrag) {
      return {};
    }

    const sourceAssignment = operationsAssignments[spaceDrag.sourceSpaceKey];
    if (!sourceAssignment?.trailer) {
      return {};
    }

    // Completed dock item (issue state) should only move to yard spaces.
    // Mark all dock slots as "do not use", and yard defaults as "good" (includes converted docks).
    if (sourceAssignment.type === 'dock' && sourceAssignment.state === 'issue') {
      const mapping: Record<string, DockSuggestionTier> = {};
      Object.entries(operationsAssignments).forEach(([key, assignment]) => {
        if (assignment.type === 'dock') {
          mapping[key] = 'dont_use';
          return;
        }
        if (assignment.type === 'yard' && assignment.state === 'default' && assignment.trailer === null) {
          mapping[key] = 'good';
        }
      });
      return mapping;
    }

    const trailerNumber = sourceAssignment?.trailer?.trailerNumber ?? '';
    const availableDockKeys = Object.entries(operationsAssignments)
      .filter(
        ([, assignment]) => assignment.type === 'dock' && assignment.state === 'default' && assignment.trailer === null
      )
      .map(([spaceKey]) => spaceKey)
      .sort();

    if (availableDockKeys.length === 0) {
        return {};
    }

    // Pick the "best" 3 docks in a stable way that doesn't change when one dock becomes occupied.
    // This keeps the pulsing set consistent when you drop onto a green option, then immediately move again.
    const allDockKeys = Object.entries(operationsAssignments)
      .filter(([, assignment]) => assignment.type === 'dock')
      .map(([spaceKey]) => spaceKey)
      .sort();

    const hashString = (input: string) => {
      // Simple stable 32-bit rolling hash.
      let h = 2166136261;
      for (let i = 0; i < input.length; i += 1) {
        h = Math.imul(h ^ input.charCodeAt(i), 16777619);
      }
      return h >>> 0;
    };

    const scoreByKey: Record<string, number> = {};
    allDockKeys.forEach((key) => {
      scoreByKey[key] = hashString(`${trailerNumber}|${key}`);
    });

    const rankedAll = [...allDockKeys].sort((a, b) => {
      const sa = scoreByKey[a] ?? 0;
      const sb = scoreByKey[b] ?? 0;
      if (sb !== sa) {
        return sb - sa;
      }
      return a.localeCompare(b);
    });

    const bestKeys = rankedAll.slice(0, 3);
    const tierByKey: Partial<Record<string, DockSuggestionTier>> = {};
    const tierOrder: DockSuggestionTier[] = ['best', 'better', 'good'];
    bestKeys.forEach((key, idx) => {
      tierByKey[key] = tierOrder[idx] ?? 'good';
    });

    const mapping: Record<string, DockSuggestionTier> = {};
    availableDockKeys.forEach((key) => {
      mapping[key] = tierByKey[key] ?? 'dont_use';
    });

    return mapping;
  })();
  const selectedYardMoveTaskAssignment =
    appMode === 'operations' &&
    selection?.type === 'space' &&
    selectedSpaceAssignment?.type === 'yard' &&
    selectedSpaceAssignment.state === 'move-task' &&
    selectedSpaceAssignment.trailer
      ? selectedSpaceAssignment
      : null;
  const selectedYardMoveTaskBounds = selectedYardMoveTaskAssignment
    ? spaceRefs.current[selectedYardMoveTaskAssignment.key]?.getBoundingClientRect() ?? null
    : null;
  const selectedDockAvailabilityAssignment =
    appMode === 'operations' &&
    selection?.type === 'space' &&
    selectedSpaceAssignment?.type === 'dock' &&
    (selectedSpaceAssignment.state === 'default' || selectedSpaceAssignment.state === 'blocked')
      ? selectedSpaceAssignment
      : null;
  const selectedDockAvailabilityBounds = selectedDockAvailabilityAssignment
    ? spaceRefs.current[selectedDockAvailabilityAssignment.key]?.getBoundingClientRect() ?? null
    : null;
  const selectedInProgressAssignment =
    appMode === 'operations' &&
    selection?.type === 'space' &&
    selectedSpaceAssignment?.state === 'in-progress' &&
    selectedSpaceAssignment.trailer
      ? selectedSpaceAssignment
      : null;
  const selectedInProgressBounds = selectedInProgressAssignment
    ? spaceRefs.current[selectedInProgressAssignment.key]?.getBoundingClientRect() ?? null
    : null;

  const selectedTrailerStatusLabel = selectedSpaceAssignment?.state
    ? (() => {
        switch (selectedSpaceAssignment.state) {
          case 'in-progress':
            return 'In Progress';
          case 'move-task':
            return 'In Progress';
          case 'pull-task':
            return 'Pull Task';
          case 'occupied':
            return 'Occupied';
          case 'issue':
            return 'Complete';
          case 'blocked':
            return 'Blocked';
          case 'default':
          default:
            return 'Available';
        }
      })()
    : null;

  const selectedTrailerLocationLabel = selectedSpaceAssignment
    ? (() => {
        if (selectedSpaceAssignment.type === 'yard') {
          return `Yard - ${selectedSpaceAssignment.slotLabel}`;
        }

        // Dock placement location label
        return `${selectedSpaceAssignment.groupName} ${selectedSpaceAssignment.slotLabel}`;
      })()
    : null;

  const selectedMoveTaskDockAssignment =
    selectedSpaceAssignment?.trailer?.trailerNumber
      ? Object.values(operationsAssignments).find(
          (assignment) =>
            assignment.type === 'dock' &&
            assignment.state === 'move-task' &&
            assignment.trailer?.trailerNumber === selectedSpaceAssignment.trailer!.trailerNumber
        ) ?? null
      : null;

  useEffect(() => {
    if (appMode !== 'operations' || selectedMoveTaskTrailerNumber === null) {
      return;
    }

    let nestedFrameId: number | null = null;
    const frameId = window.requestAnimationFrame(() => {
      // Wait an extra frame so rebuilt row/dock refs are registered after layout edits.
      nestedFrameId = window.requestAnimationFrame(() => {
        setMoveTaskConnectionRefresh((current) => current + 1);
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (nestedFrameId !== null) {
        window.cancelAnimationFrame(nestedFrameId);
      }
    };
  }, [appMode, buildings, rows, selection?.type, selection?.type === 'space' ? selection.spaceKey : null, operationsAssignments, selectedMoveTaskTrailerNumber]);

  useEffect(() => {
    if (appMode !== 'operations' || selectedPullTaskTrailerNumber === null) {
      return;
    }

    let nestedFrameId: number | null = null;
    const frameId = window.requestAnimationFrame(() => {
      // Wait an extra frame so rebuilt row/dock refs are registered after layout edits.
      nestedFrameId = window.requestAnimationFrame(() => {
        setMoveTaskConnectionRefresh((current) => current + 1);
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (nestedFrameId !== null) {
        window.cancelAnimationFrame(nestedFrameId);
      }
    };
  }, [appMode, buildings, rows, selection?.type, selection?.type === 'space' ? selection.spaceKey : null, operationsAssignments, selectedPullTaskTrailerNumber]);

  const registerSpaceRef = (spaceKey: string, node: HTMLDivElement | null) => {
    spaceRefs.current[spaceKey] = node;
  };
  const registerSpaceIndicatorRef = (spaceKey: string, node: HTMLSpanElement | null) => {
    spaceIndicatorRefs.current[spaceKey] = node;
  };
  const registerSpaceControlRef = (spaceKey: string, node: HTMLSpanElement | null) => {
    spaceControlRefs.current[spaceKey] = node;
  };
  const getNodeCenter = (node: Element, canvasBounds: DOMRect) => {
    const bounds = node.getBoundingClientRect();

    return {
      x: bounds.left - canvasBounds.left + bounds.width / 2,
      y: bounds.top - canvasBounds.top + bounds.height / 2,
    };
  };
  const getMoveTaskConnectionPath = () => {
    void moveTaskConnectionRefresh;

    if (appMode !== 'operations' || selectedMoveTaskAssignments.length < 2) {
      return null;
    }

    const canvasBounds = canvasAreaRef.current?.getBoundingClientRect();

    if (!canvasBounds) {
      return null;
    }

    const yardAssignment =
      selectedMoveTaskAssignments.find((assignment) => assignment.type === 'yard') ?? selectedMoveTaskAssignments[0];
    const dockAssignment =
      selectedMoveTaskAssignments.find((assignment) => assignment.type === 'dock') ?? selectedMoveTaskAssignments[1];
    const yardIndicator = spaceIndicatorRefs.current[yardAssignment.key];
    const yardControl = spaceControlRefs.current[yardAssignment.key];
    const dockIndicator = spaceIndicatorRefs.current[dockAssignment.key];
    const dockControl = spaceControlRefs.current[dockAssignment.key];

    if (!yardIndicator || !yardControl || !dockIndicator || !dockControl) {
      return null;
    }

    const start = getNodeCenter(yardIndicator, canvasBounds);
    const startControl = getNodeCenter(yardControl, canvasBounds);
    const end = getNodeCenter(dockIndicator, canvasBounds);
    const endControl = getNodeCenter(dockControl, canvasBounds);

    return `M ${start.x} ${start.y} C ${startControl.x} ${startControl.y}, ${endControl.x} ${endControl.y}, ${end.x} ${end.y}`;
  };

  const moveTaskConnectionPath = getMoveTaskConnectionPath();

  const getPullTaskConnectionPath = () => {
    void moveTaskConnectionRefresh;

    if (appMode !== 'operations' || selectedPullTaskAssignments.length < 2) {
      return null;
    }

    const canvasBounds = canvasAreaRef.current?.getBoundingClientRect();
    if (!canvasBounds) {
      return null;
    }

    const yardAssignment =
      selectedPullTaskAssignments.find((assignment) => assignment.type === 'yard') ?? selectedPullTaskAssignments[0];
    const dockAssignment =
      selectedPullTaskAssignments.find((assignment) => assignment.type === 'dock') ?? selectedPullTaskAssignments[1];

    const yardIndicator = spaceIndicatorRefs.current[yardAssignment.key];
    const yardControl = spaceControlRefs.current[yardAssignment.key];
    const dockIndicator = spaceIndicatorRefs.current[dockAssignment.key];
    const dockControl = spaceControlRefs.current[dockAssignment.key];

    if (!yardIndicator || !yardControl || !dockIndicator || !dockControl) {
      return null;
    }

    const start = getNodeCenter(yardIndicator, canvasBounds);
    const startControl = getNodeCenter(yardControl, canvasBounds);
    const end = getNodeCenter(dockIndicator, canvasBounds);
    const endControl = getNodeCenter(dockControl, canvasBounds);

    return `M ${start.x} ${start.y} C ${startControl.x} ${startControl.y}, ${endControl.x} ${endControl.y}, ${end.x} ${end.y}`;
  };

  const pullTaskConnectionPath = getPullTaskConnectionPath();

  const getRemoteCanvasDropConnectionPath = () => {
    if (appMode !== 'operations' || !spaceDrag || !remoteCanvasDropHover) {
      return null;
    }

    const canvasBounds = canvasAreaRef.current?.getBoundingClientRect();
    if (!canvasBounds) {
      return null;
    }

    const sourceSpaceKey = spaceDrag.sourceSpaceKey;
    const sourceNode = spaceRefs.current[sourceSpaceKey];
    const yardIndicator = spaceIndicatorRefs.current[sourceSpaceKey] ?? sourceNode;
    const yardControl = spaceControlRefs.current[sourceSpaceKey] ?? sourceNode;

    if (!yardIndicator || !yardControl) {
      return null;
    }

    const start = getNodeCenter(yardIndicator, canvasBounds);
    const startControl = getNodeCenter(yardControl, canvasBounds);

    const end = {
      x: remoteCanvasDropHover.bounds.left - canvasBounds.left + remoteCanvasDropHover.bounds.width / 2,
      // Top side of the button.
      y: remoteCanvasDropHover.bounds.top - canvasBounds.top,
    };

    // Make the line hit the top of the preview button perpendicularly (vertical tangent),
    // while approaching from above the button (so it doesn't dip under).
    const approachHeight = Math.min(remoteCanvasDropHover.bounds.height / 2, 60);
    const endControl = {
      x: end.x,
      y: end.y - approachHeight,
    };

    return `M ${start.x} ${start.y} C ${startControl.x} ${startControl.y}, ${endControl.x} ${endControl.y}, ${end.x} ${end.y}`;
  };

  const remoteCanvasDropConnectionPath = getRemoteCanvasDropConnectionPath();

  const getRemoteMoveTaskConnectionPath = () => {
    if (appMode !== 'operations' || !selectedMoveTaskTrailerNumber) {
      return null;
    }

    // Only draw the remote connection when the current canvas has exactly one move-task assignment
    // for the selected trailer (i.e. the other side is on a different canvas).
    if (selectedMoveTaskAssignments.length !== 1) {
      return null;
    }

    const localAssignment = selectedMoveTaskAssignments[0];

    const remoteCanvasMatch = remoteCanvasSnapshots.find((snapshot) =>
      Object.values(snapshot.operationsAssignments).some(
        (assignment) => assignment.state === 'move-task' && assignment.trailer?.trailerNumber === selectedMoveTaskTrailerNumber
      )
    );

    if (!remoteCanvasMatch) {
      return null;
    }

    const canvasBounds = canvasAreaRef.current?.getBoundingClientRect();
    if (!canvasBounds) {
      return null;
    }

    const remoteButtonNode = remoteCanvasButtonRefs.current[remoteCanvasMatch.id];
    if (!remoteButtonNode) {
      return null;
    }

    const remoteButtonBounds = remoteButtonNode.getBoundingClientRect();

    const startIndicator = spaceIndicatorRefs.current[localAssignment.key];
    const startControl = spaceControlRefs.current[localAssignment.key];
    if (!startIndicator || !startControl) {
      return null;
    }

    const start = getNodeCenter(startIndicator, canvasBounds);
    const startControlPoint = getNodeCenter(startControl, canvasBounds);

    const end = {
      x: remoteButtonBounds.left - canvasBounds.left + remoteButtonBounds.width / 2,
      // Top side of the remote canvas button.
      y: remoteButtonBounds.top - canvasBounds.top,
    };

    // Same perpendicular approach: vertical tangent at the button top, approaching from above.
    const approachHeight = Math.min(remoteButtonBounds.height / 2, 60);
    const endControl = {
      x: end.x,
      y: end.y - approachHeight,
    };

    return `M ${start.x} ${start.y} C ${startControlPoint.x} ${startControlPoint.y}, ${endControl.x} ${endControl.y}, ${end.x} ${end.y}`;
  };

  const remoteMoveTaskConnectionPath = getRemoteMoveTaskConnectionPath();

  const getRemotePullTaskConnectionPath = () => {
    if (appMode !== 'operations' || !selectedPullTaskTrailerNumber) {
      return null;
    }

    // Only draw the remote connection when this canvas has exactly one pull-task side.
    if (selectedPullTaskAssignments.length !== 1) {
      return null;
    }

    const localAssignment = selectedPullTaskAssignments[0];

    const remoteCanvasMatch = remoteCanvasSnapshots.find((snapshot) =>
      Object.values(snapshot.operationsAssignments).some(
        (assignment) => assignment.state === 'pull-task' && assignment.trailer?.trailerNumber === selectedPullTaskTrailerNumber
      )
    );

    if (!remoteCanvasMatch) {
      return null;
    }

    const canvasBounds = canvasAreaRef.current?.getBoundingClientRect();
    if (!canvasBounds) {
      return null;
    }

    const remoteButtonNode = remoteCanvasButtonRefs.current[remoteCanvasMatch.id];
    if (!remoteButtonNode) {
      return null;
    }

    const remoteButtonBounds = remoteButtonNode.getBoundingClientRect();

    const startIndicator = spaceIndicatorRefs.current[localAssignment.key] ?? spaceRefs.current[localAssignment.key];
    const startControl = spaceControlRefs.current[localAssignment.key] ?? spaceRefs.current[localAssignment.key];
    if (!startIndicator || !startControl) {
      return null;
    }

    const start = getNodeCenter(startIndicator, canvasBounds);
    const startControlPoint = getNodeCenter(startControl, canvasBounds);

    const end = {
      x: remoteButtonBounds.left - canvasBounds.left + remoteButtonBounds.width / 2,
      y: remoteButtonBounds.top - canvasBounds.top,
    };

    const approachHeight = Math.min(remoteButtonBounds.height / 2, 60);
    const endControl = {
      x: end.x,
      y: end.y - approachHeight,
    };

    return `M ${start.x} ${start.y} C ${startControlPoint.x} ${startControlPoint.y}, ${endControl.x} ${endControl.y}, ${end.x} ${end.y}`;
  };

  const remotePullTaskConnectionPath = getRemotePullTaskConnectionPath();

  const updateBuilding = (buildingId: string, updater: (building: BuildingItem) => BuildingItem) => {
    setBuildings((current) => current.map((building) => (building.id === buildingId ? updater(building) : building)));
  };

  const updateSelectedBuildingRect = (updates: Partial<CanvasRect>) => {
    if (!selectedBuilding) {
      return;
    }

    updateBuilding(selectedBuilding.id, (building) => ({
      ...building,
      components: scaleBuildingComponents(building.components, building.rect, { ...building.rect, ...updates }),
      docks: realignDockPlacements(
        building.docks,
        building.rect,
        { ...building.rect, ...updates },
        scaleBuildingShape(building.shape, building.rect, { ...building.rect, ...updates })
      ),
      rect: { ...building.rect, ...updates },
      shape: scaleBuildingShape(building.shape, building.rect, { ...building.rect, ...updates }),
    }));
  };

  const updateSelectedBuildingSettings = (updates: Partial<BuildingSettings>) => {
    if (!selectedBuilding) {
      return;
    }

    updateBuilding(selectedBuilding.id, (building) => ({
      ...building,
      settings: { ...building.settings, ...updates },
    }));
  };

  const updateSelectedDockSettings = (updates: Partial<DockSettings>) => {
    if (!selectedBuilding || !selectedDock) {
      return;
    }

    updateBuilding(selectedBuilding.id, (building) => ({
      ...building,
      docks: building.docks.map((dock) =>
        dock.id === selectedDock.id
          ? {
              ...dock,
              settings: { ...dock.settings, ...updates },
            }
          : dock
      ),
    }));
  };

  const updateSelectedRowSettings = (updates: Partial<RowSettings>) => {
    if (!selectedRow) {
      return;
    }

    setRows((current) =>
      current.map((row) =>
        row.id === selectedRow.id
          ? {
              ...row,
              settings: { ...row.settings, ...updates },
            }
          : row
      )
    );
  };

  const isMultiBuildingSelection = selectedBuildingIds.length > 1;
  const isEditingCombinedBuilding =
    selection?.type === 'building' &&
    editingCombinedBuildingId === selection.buildingId &&
    (selectedBuilding?.components.length ?? 0) > 1;
  const operationsSummary = Object.values(operationsAssignments).reduce(
    (summary, assignment) => {
      summary.total += 1;

      if (assignment.trailer) {
        summary.occupied += 1;
      } else if (assignment.state === 'blocked') {
        summary.blocked += 1;
      } else {
        summary.available += 1;
      }

      return summary;
    },
    { available: 0, blocked: 0, occupied: 0, total: 0 }
  );

  const getSnapshotLocationStats = (snapshot: CanvasSnapshot) => {
    const values = Object.values(snapshot.operationsAssignments);

    const getTrailerIsEmpty = (trailer: TrailerRecord) => {
      if (typeof trailer.isEmpty === 'boolean') {
        return trailer.isEmpty;
      }

      // Back-compat for older docs: infer from trailer number if needed.
      // This keeps stats deterministic even when `isEmpty` wasn't stored.
      const match = trailer.trailerNumber.match(/\d+/);
      const number = match ? Number.parseInt(match[0], 10) : 0;
      return number % 2 === 0;
    };

    const emptyTrailers = values.filter((assignment) => Boolean(assignment.trailer) && assignment.trailer && getTrailerIsEmpty(assignment.trailer)).length;
    const fullTrailers = values.filter((assignment) => Boolean(assignment.trailer) && assignment.trailer && !getTrailerIsEmpty(assignment.trailer)).length;

    // "Available" is based on physical vacancy (no trailer). For docks, exclude blocked slots.
    const availableDocks = values.filter((assignment) => assignment.type === 'dock' && assignment.trailer === null && assignment.state !== 'blocked').length;
    const availableParkingSpaces = values.filter((assignment) => assignment.type === 'yard' && assignment.trailer === null).length;
    const totalYardSpaces = values.filter((assignment) => assignment.type === 'yard').length;

    return { emptyTrailers, fullTrailers, availableDocks, availableParkingSpaces, totalYardSpaces };
  };
  const panelTitle =
    appMode === 'operations'
      ? selectedSpaceAssignment
        ? 'Trailer Details'
        : 'Operations'
      : isMultiBuildingSelection
        ? 'Building Selection'
        : selection?.type === 'row' || isDrawingRow
          ? 'Row Settings'
          : selection?.type === 'dock' || selectingEdge
            ? 'Dock Settings'
            : selection?.type === 'building'
              ? 'Building Settings'
              : 'General Setting';
  const previewRect =
    isDrawingBuilding && buildingDraftStart && buildingDraftCurrent
      ? normalizeRect(buildingDraftStart, buildingDraftCurrent)
      : null;
  const previewRow =
    isDrawingRow && rowDraftStart && rowDraftCurrent
      ? {
          end: rowDraftCurrent,
          id: 'row-preview',
          settings: rowSettings,
          start: rowDraftStart,
        }
      : null;

  return (
    <main className="facility-app">
      <section className={['facility-shell', appMode === 'operations' ? 'facility-shell--operations' : ''].filter(Boolean).join(' ')}>
        <div className="canvas-panel">
          <header className="canvas-toolbar">
            <div className="canvas-toolbar__search" />
            {appMode === 'build' ? (
              <div className="toolbar-menu">
                <button
                  className={['toolbar-button', 'toolbar-button--primary'].join(' ')}
                  onClick={handleOpenAddMenu}
                  type="button"
                >
                  <span className="toolbar-button__plus">+</span>
                  <span>Add</span>
                </button>
                {addMenuOpen ? (
                  <div className="action-menu action-menu--add">
                    <button
                      className="action-menu__item action-menu__item--active"
                      onClick={handleStartBuilding}
                      type="button"
                    >
                      Building
                    </button>
                    <button className="action-menu__item" onClick={handleAddDock} type="button">
                      Dock
                    </button>
                    <button className="action-menu__item" onClick={handleStartRow} type="button">
                      Row
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="toolbar-menu toolbar-menu--more">
              <button aria-label="More actions" className="toolbar-more" onClick={handleOpenMoreMenu} type="button">
                <span />
                <span />
                <span />
              </button>
              {moreMenuOpen ? (
                <div className="action-menu action-menu--more">
                  <button className="action-menu__item" onClick={handleNewDocument} type="button">
                    New
                  </button>
                  <button className="action-menu__item" onClick={handleOpenDocument} type="button">
                    Open
                  </button>
                  {appMode === 'operations' ? (
                    <>
                      <button className="action-menu__item" onClick={handleSaveDocument} type="button">
                        Save
                      </button>
                      <button className="action-menu__item" onClick={() => handleModeChange('build')} type="button">
                        Edit
                      </button>
                    </>
                  ) : (
                    <button className="action-menu__item" onClick={handleSaveDocument} type="button">
                      Save
                    </button>
                  )}
                  <button className="action-menu__item" onClick={handleSaveAsDocument} type="button">
                    Save As
                  </button>
                </div>
              ) : null}
            </div>
            <input
              accept="application/json,.json"
              hidden
              onChange={handleDocumentSelected}
              ref={fileInputRef}
              type="file"
            />
          </header>

          <div
            className={[
              'canvas-area',
              isDrawingBuilding || isDrawingRow ? 'canvas-area--drawing' : '',
              buildingDrag ? 'canvas-area--dragging' : '',
              buildingResize ? 'canvas-area--resizing' : '',
              canvasPan || spacePressed ? 'canvas-area--panning' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            ref={canvasAreaRef}
            style={{ background: canvasBackgroundColor }}
            onWheel={handleCanvasWheel}
            onMouseLeave={handleCanvasLeave}
            onMouseMove={handleCanvasMove}
            onMouseUp={handleCanvasMouseUp}
            role="presentation"
          >
            {isDrawingBuilding ? (
              <div className="instruction-banner">
                <span>
                  {buildingDraftStart
                    ? 'Move to the opposite corner and click to finish the building'
                    : 'Click where the first corner of the building should be'}
                </span>
                <button
                  className="instruction-banner__close"
                  onClick={() => {
                    setIsDrawingBuilding(false);
                    setBuildingDraftStart(null);
                    setBuildingDraftCurrent(null);
                  }}
                  type="button"
                >
                  ×
                </button>
              </div>
            ) : isDrawingRow ? (
              <div className="instruction-banner">
                <span>
                  {rowDraftStart
                    ? 'Move to the second point and click to finish the row'
                    : 'Click where the row should start'}
                </span>
                <button
                  className="instruction-banner__close"
                  onClick={() => {
                    setIsDrawingRow(false);
                    setRowDraftStart(null);
                    setRowDraftCurrent(null);
                  }}
                  type="button"
                >
                  ×
                </button>
              </div>
            ) : selectingEdge ? (
              <div className="instruction-banner">
                <span>Select the edge of the building where you want to add docks</span>
                <button className="instruction-banner__close" onClick={() => setSelectingEdge(false)} type="button">
                  ×
                </button>
              </div>
            ) : null}
            <div
              className={[
                'canvas-dropzone',
                isDrawingBuilding || isDrawingRow ? 'canvas-dropzone--drawing' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={handleCanvasClick}
              onMouseDownCapture={(event) => {
                if (event.button === 1 || spacePressed) {
                  event.preventDefault();
                  event.stopPropagation();
                  skipCanvasClickRef.current = true;
                  setCanvasPan({
                    startClientX: event.clientX,
                    startClientY: event.clientY,
                    startX: viewport.x,
                    startY: viewport.y,
                  });
                  return;
                }

                if (!isDrawingBuilding || buildingDraftStart) {
                  return;
                }

                const point = getCanvasPoint(event.clientX, event.clientY);

                if (!point) {
                  return;
                }

                setBuildingDraftStart(point);
                setBuildingDraftCurrent(point);
                buildingPointerDownRef.current = true;
                buildingDragDrawRef.current = false;
                skipCanvasClickRef.current = true;
              }}
              ref={canvasRef}
            >
              <div
                className="canvas-world"
                style={{
                  transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                  transformOrigin: 'top left',
                }}
              >
                {rows.map((row) => (
                  <ParkingRowView
                    appMode={appMode}
                    dockSuggestionBySpaceKey={dockSuggestionBySpaceKey}
                    draggedSpaceKey={draggedSpaceKey}
                    isPreview={false}
                    key={row.id}
                    onMoveStart={handleRowMoveStart}
                    onHandleStart={handleRowHandleStart}
                    onSpaceDragEnd={handleSpaceDragEnd}
                    onSpaceDragMove={handleSpaceDragMove}
                    onSpaceDragStart={handleSpaceDragStart}
                    onSpaceDragPreview={setSpaceDragPreview}
                    onSpaceSelect={handleSpaceSelect}
                    onSpaceHoverEnter={(spaceKey) => setHoveredSpaceKeyWithGrace(spaceKey)}
                    onSpaceHoverLeave={(spaceKey) => scheduleClearHoveredSpaceKey(spaceKey)}
                    operationsAssignments={operationsAssignments}
                    registerSpaceControlRef={registerSpaceControlRef}
                    registerSpaceIndicatorRef={registerSpaceIndicatorRef}
                    registerSpaceRef={registerSpaceRef}
                    row={row}
                    selected={appMode === 'build' && selection?.type === 'row' && selection.rowId === row.id}
                    selectedMoveTaskSpaceKeys={selectedMoveTaskSpaceKeys}
                    selectedMoveTaskTrailerNumber={selectedMoveTaskTrailerNumber}
                    selectedPullTaskTrailerNumber={selectedPullTaskTrailerNumber}
                    selectedSpaceKey={selection?.type === 'space' ? selection.spaceKey : null}
                  dockDragHover={dockDragHover}
                  onCompleteToYardDragOver={(event, spaceKey, rowEdge, rowAngle) => {
                    const sourceKey = spaceDrag?.sourceSpaceKey;
                    const sourceAssignment = sourceKey ? operationsAssignments[sourceKey] : null;
                    const targetAssignment = operationsAssignments[spaceKey];

                    const isAllowedCompleteToYard =
                      appMode === 'operations' &&
                      sourceAssignment?.type === 'dock' &&
                      sourceAssignment.state === 'issue' &&
                      Boolean(sourceAssignment.trailer) &&
                      targetAssignment?.type === 'yard' &&
                      targetAssignment.state === 'default';

                    if (isAllowedCompleteToYard) {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      setDockDragHover({ edge: rowEdge, spaceKey });
                      setDragPreviewEdge(rowEdge);
                      setDragPreviewFollowsSourceAngle(false);
                      setDragPreviewAngleOverride(rowAngle);
                    }
                  }}
                  onCompleteToYardDragLeave={(spaceKey) => {
                    setDockDragHover((current) => (current?.spaceKey === spaceKey ? null : current));
                  }}
                  onCompleteToYardDrop={(event, spaceKey) => {
                    if (appMode !== 'operations') {
                      return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    handleSpaceDrop(spaceKey);
                  }}
                    onSelect={() => {
                      if (appMode === 'build') {
                        setEditingCombinedBuildingId(null);
                        setSelection({ rowId: row.id, type: 'row' });
                      }
                    }}
                  />
                ))}
                {buildings.map((building) => (
                  <div
                  className={[
                    'building-card',
                    selectedBuildingIds.includes(building.id) ? 'building-card--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={building.id}
                  style={{
                    left: `${building.rect.x}px`,
                    top: `${building.rect.y}px`,
                    transform: `rotate(${building.settings.angle}deg)`,
                    transformOrigin: 'center center',
                    width: `${building.rect.width}px`,
                    height: `${building.rect.height}px`,
                  }}
                >
                  {selectedBuildingIds.includes(building.id) ? (
                    <div className="building-card__selection-frame" aria-hidden="true" />
                  ) : null}
                  <div
                    className="building-card__shape"
                    onMouseDown={(event) => {
                      if (appMode !== 'build') {
                        return;
                      }

                      if (selectingEdge || isDrawingBuilding || isDrawingRow || event.shiftKey) {
                        return;
                      }

                      if (editingCombinedBuildingId === building.id) {
                        return;
                      }

                      const point = getCanvasPoint(event.clientX, event.clientY);

                      if (!point) {
                        return;
                      }

                      const localPoint = getPointInBuildingLocalSpace(building, point);
                      const edgeGrabThreshold = 28;

                      if (
                        selection?.type === 'building' &&
                        selection.buildingId === building.id &&
                        !isMultiBuildingSelection &&
                        (localPoint.x <= edgeGrabThreshold ||
                          localPoint.x >= building.rect.width - edgeGrabThreshold ||
                          localPoint.y <= edgeGrabThreshold ||
                          localPoint.y >= building.rect.height - edgeGrabThreshold)
                      ) {
                        return;
                      }

                      event.stopPropagation();
                      setSelectedBuildingIds([building.id]);
                      setSelection({ buildingId: building.id, type: 'building' });
                      setBuildingDrag({
                        buildingId: building.id,
                        offsetX: point.x - building.rect.x,
                        offsetY: point.y - building.rect.y,
                      });
                    }}
                    onClick={(event) => {
                      if (appMode === 'build' && !selectingEdge) {
                        event.stopPropagation();
                        handleBuildingSelection(building.id, event.shiftKey);
                      }
                    }}
                    onDoubleClick={(event) => {
                      if (appMode !== 'build') {
                        return;
                      }

                      if (
                        selectingEdge ||
                        isDrawingBuilding ||
                        isDrawingRow ||
                        selection?.type !== 'building' ||
                        selection.buildingId !== building.id ||
                        building.components.length < 2
                      ) {
                        return;
                      }

                      event.stopPropagation();
                      skipCanvasClickRef.current = true;
                      setEditingCombinedBuildingId(building.id);
                    }}
                  >
                    {building.shape.map((segment, index) => (
                      <div
                        className="building-card__segment"
                        key={`${building.id}-segment-${index}`}
                        style={{
                          backgroundColor: building.settings.color,
                          ...getSegmentCornerRadiusStyle(building.shape, segment),
                          left: `${segment.x}px`,
                          top: `${segment.y}px`,
                          width: `${segment.width}px`,
                          height: `${segment.height}px`,
                        }}
                      />
                    ))}
                  </div>
                  {selection?.type === 'building' &&
                  selection.buildingId === building.id &&
                  editingCombinedBuildingId === building.id &&
                  building.components.length > 1 ? (
                    <div className="building-card__component-layer">
                      {building.components.map((component) => (
                        <div
                          className="building-card__component"
                          key={component.id}
                          onMouseDown={(event) => handleBuildingComponentMoveStart(event, building, component.id)}
                          style={{
                            left: `${component.rect.x}px`,
                            top: `${component.rect.y}px`,
                            width: `${component.rect.width}px`,
                            height: `${component.rect.height}px`,
                          }}
                        >
                          {(['top', 'right', 'bottom', 'left'] as Edge[]).map((edge) => (
                            <button
                              aria-label={`Resize component ${edge} edge`}
                              className={`building-card__component-edge building-card__component-edge--${edge}`}
                              key={`${component.id}-${edge}`}
                              onMouseDown={(event) =>
                                handleBuildingComponentResizeStart(event, building, component.id, edge)
                              }
                              type="button"
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <span
                    className={[
                      'building-card__label',
                      selection?.type === 'building' && selection.buildingId === building.id
                        ? 'building-card__label--selected'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onMouseDown={(event) => {
                      if (appMode === 'build') {
                        handleBuildingLabelDragStart(event, building);
                      }
                    }}
                    style={{
                      left: `${building.settings.labelX}%`,
                      top: `${building.settings.labelY}%`,
                    }}
                  >
                    {building.settings.name}
                  </span>
                  {selectingEdge ? (
                    <div className="building-card__edge-targets">
                      {getExposedEdgeSegments(building.shape).map((segment) => (
                        <button
                          key={segment.id}
                          aria-label={`Select ${segment.edge} edge`}
                          className={[
                            'building-card__edge',
                            'building-card__edge--segment',
                            `building-card__edge--segment-${segment.edge}`,
                            hoverTarget?.buildingId === building.id && hoverTarget.segmentId === segment.id
                              ? 'building-card__edge--hovered'
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdgeSelect(building.id, {
                              edge: segment.edge,
                              length: segment.length,
                              x: segment.x,
                              y: segment.y,
                            });
                          }}
                          onMouseEnter={() => setHoverTarget({ buildingId: building.id, segmentId: segment.id })}
                          onMouseLeave={() =>
                            setHoverTarget((current) =>
                              current?.buildingId === building.id && current.segmentId === segment.id ? null : current
                            )
                          }
                          style={{
                            height: segment.edge === 'left' || segment.edge === 'right' ? `${segment.length}px` : '12px',
                            left: segment.edge === 'right' ? `${segment.x - 6}px` : `${segment.x}px`,
                            top: segment.edge === 'bottom' ? `${segment.y - 6}px` : `${segment.y}px`,
                            width: segment.edge === 'top' || segment.edge === 'bottom' ? `${segment.length}px` : '12px',
                          }}
                          type="button"
                        />
                      ))}
                    </div>
                  ) : selection?.type === 'building' && selection.buildingId === building.id && !isMultiBuildingSelection ? (
                    <div className="building-card__edge-targets">
                      {(['top', 'right', 'bottom', 'left'] as Edge[]).map((edge) => (
                        <button
                          key={edge}
                          aria-label={`Resize ${edge} edge`}
                          className={`building-card__edge building-card__edge--${edge}`}
                          onMouseDown={(event) => {
                            handleResizeStart(event, building, edge);
                          }}
                          type="button"
                        />
                      ))}
                    </div>
                  ) : null}
                  {building.docks.map((dockPlacement) => (
                    <div
                      className={[
                        'dock-strip',
                        `dock-strip--${dockPlacement.edge}`,
                        `dock-strip--align-${dockPlacement.settings.alignment.toLowerCase()}`,
                        selection?.type === 'dock' && selection.dockId === dockPlacement.id ? 'dock-strip--selected' : '',
                      ].join(' ')}
                      key={dockPlacement.id}
                      style={getDockStripStyle(dockPlacement.anchor)}
                    >
                      <div
                        className={`dock-strip__group dock-strip__group--${dockPlacement.edge}`}
                        onMouseDown={(event) => {
                          if (!selectingEdge) {
                            event.stopPropagation();
                          }
                        }}
                        onClick={(event) => {
                          if (appMode === 'build' && !selectingEdge) {
                            event.stopPropagation();
                            setEditingCombinedBuildingId(null);
                            setSelectedBuildingIds([]);
                            setSelection({ buildingId: building.id, dockId: dockPlacement.id, type: 'dock' });
                          }
                        }}
                      >
                        <div
                          className={[
                            'dock-strip__dock-row',
                            `dock-strip__dock-row--edge-${dockPlacement.edge}`,
                          ].join(' ')}
                        >
                          {getDockNumbers(dockPlacement.settings).map((dock) => {
                            const spaceKey = getDockSpaceKey(building.id, dockPlacement.id, dock);
                            const assignment = operationsAssignments[spaceKey];
                            const visualState = appMode === 'operations' ? assignment?.state ?? 'default' : 'default';
                            const trailerNumber =
                              appMode === 'operations' ? assignment?.trailer?.trailerNumber ?? null : null;
                            const remoteMoveTaskRole =
                              appMode === 'operations' ? assignment?.remoteMoveTaskRole ?? null : null;

                            return (
                              <Dock
                                controlRef={(node) => registerSpaceControlRef(spaceKey, node)}
                                onHoverEnter={() => setHoveredSpaceKeyWithGrace(spaceKey)}
                                onHoverLeave={() => scheduleClearHoveredSpaceKey(spaceKey)}
                                draggable={
                                  appMode === 'operations' &&
                                  Boolean(assignment?.trailer) &&
                                  ((assignment?.type === 'dock' &&
                                    (assignment.state === 'move-task' || assignment.state === 'issue')) ||
                                    (assignment?.type === 'yard' &&
                                      ((assignment.state !== 'move-task' && assignment.state !== 'pull-task') ||
                                        (assignment.state === 'move-task' && assignment.remoteMoveTaskRole === 'destination'))))
                                }
                                dropHovered={dockDragHover?.spaceKey === spaceKey}
                                edge={dockPlacement.edge}
                                hideMoveIndicator={selectedMoveTaskSpaceKeys.has(spaceKey)}
                                indicatorRef={(node) => registerSpaceIndicatorRef(spaceKey, node)}
                                key={dock}
                                label={dock}
                                remoteMoveTaskRole={remoteMoveTaskRole}
                                onDrag={handleSpaceDragMove}
                                onDragEnd={handleSpaceDragEnd}
                                onDragLeave={() => {
                                  setDockDragHover((current) => (current?.spaceKey === spaceKey ? null : current));
                                }}
                                onDragOver={(event) => {
                                  const sourceKey = spaceDrag?.sourceSpaceKey;
                                  const targetAssignment = operationsAssignments[spaceKey];
                                  const sourceAssignment = sourceKey ? operationsAssignments[sourceKey] : null;
                                  const isAllowedDockDrop =
                                    appMode === 'operations' &&
                                    (
                                      (sourceAssignment?.type === 'yard' && sourceAssignment.state !== 'move-task') ||
                                      (sourceAssignment?.type === 'yard' &&
                                        sourceAssignment.state === 'move-task' &&
                                        sourceAssignment.remoteMoveTaskRole === 'destination') ||
                                      (sourceAssignment?.type === 'dock' && sourceAssignment.state === 'move-task')
                                    ) &&
                                    Boolean(sourceAssignment?.trailer) &&
                                    targetAssignment?.type === 'dock' &&
                                    targetAssignment.state === 'default';
                                  const isAllowedCompleteToConvertedDockYard =
                                    appMode === 'operations' &&
                                    sourceAssignment?.type === 'dock' &&
                                    sourceAssignment.state === 'issue' &&
                                    Boolean(sourceAssignment.trailer) &&
                                    targetAssignment?.type === 'yard' &&
                                    targetAssignment.state === 'default';

                                  if (isAllowedDockDrop || isAllowedCompleteToConvertedDockYard) {
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = 'move';
                                    setDockDragHover({ edge: dockPlacement.edge, spaceKey });
                                    setDragPreviewEdge(dockPlacement.edge);
                                    setDragPreviewFollowsSourceAngle(false);
                                    setDragPreviewAngleOverride(0);
                                  }
                                }}
                                onDragStart={(event) => {
                                  const allowed = handleSpaceDragStart(spaceKey, dockPlacement.edge, 0, {
                                    x: event.clientX,
                                    y: event.clientY,
                                  });

                                  if (!allowed) {
                                    event.preventDefault();
                                    return;
                                  }

                                  event.stopPropagation();
                                  event.dataTransfer.effectAllowed = 'move';
                                  event.dataTransfer.setData('text/plain', spaceKey);
                                  setSpaceDragPreview(event);
                                }}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleSpaceDrop(spaceKey);
                                }}
                                onClick={
                                  appMode === 'operations'
                                    ? () =>
                                        handleSpaceSelect(spaceKey)
                                    : undefined
                                }
                                selected={
                                  draggedSpaceKey === spaceKey ||
                                  (selection?.type === 'space' && selection.spaceKey === spaceKey) ||
                                  (selectedMoveTaskTrailerNumber !== null &&
                                    assignment?.state === 'move-task' &&
                                    assignment.trailer?.trailerNumber === selectedMoveTaskTrailerNumber)
                                  ||
                                  (selectedPullTaskTrailerNumber !== null &&
                                    assignment?.state === 'pull-task' &&
                                    assignment.trailer?.trailerNumber === selectedPullTaskTrailerNumber)
                                }
                                showDoor={dockDoorEnabledBySpaceKey[spaceKey] !== false}
                                spaceRef={(node) => {
                                  spaceRefs.current[spaceKey] = node;
                                }}
                                state={visualState}
                                trailerNumber={trailerNumber}
                                suggestionTier={dockSuggestionBySpaceKey[spaceKey] ?? null}
                                type={assignment?.type ?? 'dock'}
                              />
                            );
                          })}
                        </div>
                        <div className="dock-strip__title">
                          <span className="dock-strip__title-text">{dockPlacement.settings.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                ))}
                {previewRect ? (
                  <div
                    className="building-card building-card--preview"
                    style={{
                      left: `${previewRect.x}px`,
                      top: `${previewRect.y}px`,
                      width: `${previewRect.width}px`,
                      height: `${previewRect.height}px`,
                    }}
                  />
                ) : null}
                {previewRow ? (
                  <ParkingRowView
                    appMode={appMode}
                    dockSuggestionBySpaceKey={{}}
                    draggedSpaceKey={null}
                    isPreview
                    onHandleStart={() => undefined}
                    onMoveStart={() => undefined}
                    onSpaceDragEnd={() => undefined}
                    onSpaceDragMove={() => undefined}
                    onSpaceDragStart={() => false}
                    onSpaceDragPreview={() => undefined}
                    onSelect={() => undefined}
                    onSpaceSelect={() => undefined}
                    onSpaceHoverEnter={() => undefined}
                    onSpaceHoverLeave={() => undefined}
                    operationsAssignments={operationsAssignments}
                    registerSpaceControlRef={registerSpaceControlRef}
                    registerSpaceIndicatorRef={registerSpaceIndicatorRef}
                    registerSpaceRef={registerSpaceRef}
                    row={previewRow}
                    selected={false}
                    selectedMoveTaskSpaceKeys={new Set()}
                    selectedMoveTaskTrailerNumber={null}
                    selectedPullTaskTrailerNumber={null}
                    selectedSpaceKey={null}
                  />
                ) : null}
                {buildings.length === 0 && rows.length === 0 && !previewRect && !previewRow ? (
                  <div className="canvas-placeholder">Choose Add &gt; Building or Row to start laying out the canvas</div>
                ) : (
                  null
                )}
              </div>
            </div>

            <div
              className="canvas-viewport-controls"
              style={isCanvasPreviewCaptureMode ? { display: 'none' } : undefined}
            >
              <button
                aria-label="Zoom out"
                className="canvas-viewport-controls__icon-button"
                onClick={() => setViewport((current) => ({ ...current, scale: Math.max(0.35, current.scale * 0.9) }))}
                type="button"
              >
                <span className="canvas-viewport-controls__icon-container" aria-hidden="true">
                  <span className="canvas-viewport-controls__glyph canvas-viewport-controls__glyph--minus">
                    <ZoomMinusIcon />
                  </span>
                </span>
              </button>
              <div className="canvas-viewport-controls__value">{Math.round(viewport.scale * 100)}%</div>
              <button
                aria-label="Zoom in"
                className="canvas-viewport-controls__icon-button"
                onClick={() => setViewport((current) => ({ ...current, scale: Math.min(2.5, current.scale * 1.1) }))}
                type="button"
              >
                <span className="canvas-viewport-controls__icon-container" aria-hidden="true">
                  <span className="canvas-viewport-controls__glyph canvas-viewport-controls__glyph--plus">
                    <ZoomPlusIcon />
                  </span>
                </span>
              </button>
              <button
                className="canvas-viewport-controls__reset-button"
                onClick={() => setViewport({ scale: 1, x: 0, y: 0 })}
                type="button"
              >
                <span className="canvas-viewport-controls__reset-icon-container" aria-hidden="true">
                  <span className="canvas-viewport-controls__glyph canvas-viewport-controls__glyph--reset">
                    <ZoomResetIcon />
                  </span>
                </span>
                <span className="canvas-viewport-controls__reset-label">Reset</span>
              </button>
            </div>

            <div
              className="canvas-remote-controls"
              aria-label="Remote canvas controls"
              style={isCanvasPreviewCaptureMode ? { display: 'none' } : undefined}
            >
              {(() => {
                const activeSnapshotForPreviews = getActiveCanvasSnapshot();
                const total = remoteCanvasSnapshots.length + 1;
                // If there is only a single location, don't show a preview button for the current location.
                // The "Add canvas" control still remains visible.
                if (total <= 1) {
                  return null;
                }
                const safeActiveIndex = Math.min(Math.max(activeCanvasIndex, 0), Math.max(0, total - 1));
                const orderedPreviews: CanvasSnapshot[] = [];
                let remoteIdx = 0;

                for (let i = 0; i < total; i += 1) {
                  if (i === safeActiveIndex) {
                    orderedPreviews.push(activeSnapshotForPreviews);
                  } else {
                    orderedPreviews.push(remoteCanvasSnapshots[remoteIdx]);
                    remoteIdx += 1;
                  }
                }

                return orderedPreviews.map((snapshot) => {
                  const isActive = snapshot.id === activeCanvasId;
                  const stats = getSnapshotLocationStats(snapshot);
                  const isDropHovered =
                    !isActive &&
                    appMode === 'operations' &&
                    Boolean(spaceDrag) &&
                    remoteCanvasDropHover?.canvasId === snapshot.id;

                  const buttonClassName = [
                    'canvas-remote-controls__canvas-button',
                    isActive ? 'canvas-remote-controls__current-canvas-button' : '',
                    isDropHovered ? 'canvas-remote-controls__canvas-button--drop-hovered' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  const isHoverBubbleVisible =
                    appMode === 'operations' && (isDropHovered || hoveredRemoteCanvasButtonId === snapshot.id);

                  return (
                    <button
                      key={snapshot.id}
                      aria-label={isActive ? 'Current canvas' : `Switch to ${snapshot.name}`}
                      title={snapshot.name}
                      className={buttonClassName}
                      type="button"
                      ref={(node) => {
                        remoteCanvasButtonRefs.current[snapshot.id] = node;
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (spaceDrag) {
                          return;
                        }
                        if (isActive) {
                          return;
                        }
                        void handleSwitchToRemoteCanvas(snapshot.id);
                      }}
                      onMouseEnter={() => {
                        if (appMode !== 'operations') {
                          return;
                        }
                        setHoveredRemoteCanvasButtonId(snapshot.id);
                      }}
                      onMouseLeave={() => {
                        if (appMode !== 'operations') {
                          return;
                        }
                        setHoveredRemoteCanvasButtonId((current) => (current === snapshot.id ? null : current));
                      }}
                      onDragOver={(event) => {
                        if (isActive) {
                          return;
                        }
                        if (appMode !== 'operations') {
                          return;
                        }
                        if (!spaceDrag) {
                          return;
                        }
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';

                        const rect = event.currentTarget.getBoundingClientRect();
                        setRemoteCanvasDropHover({
                          canvasId: snapshot.id,
                          bounds: {
                            left: rect.left,
                            top: rect.top,
                            width: rect.width,
                            height: rect.height,
                          },
                        });
                      }}
                      onDragLeave={() => {
                        if (isActive) {
                          return;
                        }
                        setRemoteCanvasDropHover((current) => (current?.canvasId === snapshot.id ? null : current));
                      }}
                      onDrop={(event) => {
                        if (isActive) {
                          return;
                        }
                        event.preventDefault();
                        event.stopPropagation();
                        setRemoteCanvasDropHover(null);
                        handleDropTrailerOnRemoteCanvas(snapshot.id);
                      }}
                    >
                      {isHoverBubbleVisible ? (
                        <div
                          className={[
                            'canvas-remote-controls__drop-bubble',
                            isDropHovered ? 'canvas-remote-controls__drop-bubble--auto-assign' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          role="status"
                          aria-live="polite"
                        >
                          {isDropHovered ? (
                            <>
                              <div className="canvas-remote-controls__drop-bubble-text canvas-remote-controls__drop-bubble-text--auto-assign">
                                <span className="canvas-remote-controls__drop-bubble-text-line">Auto-Assign</span>
                                <span className="canvas-remote-controls__drop-bubble-text-line">to a space in</span>
                                <span className="canvas-remote-controls__drop-bubble-text-line canvas-remote-controls__drop-bubble-location-name">
                                  {snapshot.name}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="canvas-remote-controls__drop-bubble-title">{snapshot.name}</div>
                              <div className="canvas-remote-controls__drop-bubble-row">
                                <span className="canvas-remote-controls__drop-bubble-row-label">Empty Trailers</span>
                                <span className="canvas-remote-controls__drop-bubble-row-value">{stats.emptyTrailers}</span>
                              </div>
                              <div className="canvas-remote-controls__drop-bubble-row canvas-remote-controls__drop-bubble-row--alt">
                                <span className="canvas-remote-controls__drop-bubble-row-label">Full Trailers</span>
                                <span className="canvas-remote-controls__drop-bubble-row-value">{stats.fullTrailers}</span>
                              </div>
                              <div className="canvas-remote-controls__drop-bubble-row">
                                <span className="canvas-remote-controls__drop-bubble-row-label">Available Dock</span>
                                <span className="canvas-remote-controls__drop-bubble-row-value">{stats.availableDocks}</span>
                              </div>
                              <div className="canvas-remote-controls__drop-bubble-row canvas-remote-controls__drop-bubble-row--alt">
                                <span className="canvas-remote-controls__drop-bubble-row-label">Total Parking Spaces</span>
                                <span className="canvas-remote-controls__drop-bubble-row-value">{stats.totalYardSpaces}</span>
                              </div>
                              <div className="canvas-remote-controls__drop-bubble-row canvas-remote-controls__drop-bubble-row--alt">
                                <span className="canvas-remote-controls__drop-bubble-row-label">Available Spaces</span>
                                <span className="canvas-remote-controls__drop-bubble-row-value">{stats.availableParkingSpaces}</span>
                              </div>
                            </>
                          )}
                        </div>
                      ) : null}
                      <span className="canvas-remote-controls__canvas-preview">
                        {canvasPreviewsById[snapshot.id] ? (
                          <img
                            aria-hidden="true"
                            alt=""
                            className="canvas-remote-controls__canvas-preview-image"
                            src={canvasPreviewsById[snapshot.id]}
                          />
                        ) : (
                          <CanvasMiniPreview snapshot={snapshot} />
                        )}
                      </span>

                      {isActive ? (
                        <span className="canvas-remote-controls__current-canvas-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M2.58592 12.3899C2.69191 12.6389 5.25392 18.4949 11.9999 18.4949C18.7449 18.4949 21.3089 12.6389 21.4149 12.3899L21.5799 11.9999L21.4149 11.6089C21.3089 11.3599 18.7449 5.50488 11.9999 5.50488C5.25492 5.50488 2.69192 11.3599 2.58592 11.6089L2.41992 11.9999L2.58592 12.3899ZM11.9999 16.4949C7.45291 16.4949 5.25291 13.1679 4.62091 11.9999C5.25392 10.8309 7.45291 7.50488 11.9999 7.50488C16.5459 7.50488 18.7449 10.8289 19.3779 11.9969C18.7429 13.1539 16.5189 16.4949 11.9999 16.4949ZM8.28223 12.0002C8.28223 14.0502 9.95022 15.7182 12.0002 15.7182C14.0512 15.7182 15.7192 14.0502 15.7192 12.0002C15.7192 9.95023 14.0512 8.28223 12.0002 8.28223C9.95023 8.28223 8.28223 9.95023 8.28223 12.0002ZM10.2822 12.0002C10.2822 11.0522 11.0532 10.2822 12.0002 10.2822C12.9472 10.2822 13.7192 11.0522 13.7192 12.0002C13.7192 12.9472 12.9472 13.7182 12.0002 13.7182C11.0532 13.7182 10.2822 12.9472 10.2822 12.0002Z"
                              fill="currentColor"
                            />
                          </svg>
                        </span>
                      ) : null}
                    </button>
                  );
                });
              })()}

              <button
                aria-label="Add canvas"
                className="canvas-remote-controls__add-button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (spaceDrag) {
                    return;
                  }
                  void handleAddCanvas();
                }}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="canvas-remote-controls__add-icon"
                >
                  <path
                    d="M12 5C12.5523 5 13 5.44772 13 6V11H18C18.5523 11 19 11.4477 19 12C19 12.5523 18.5523 13 18 13H13V18C13 18.5523 12.5523 19 12 19C11.4477 19 11 18.5523 11 18V13H6C5.44772 13 5 12.5523 5 12C5 11.4477 5.44772 11 6 11H11V6C11 5.44772 11.4477 5 12 5Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            {moveTaskConnectionPath ? (
              <svg className="move-task-connection" role="presentation">
                <path className="move-task-connection__path" d={moveTaskConnectionPath} />
              </svg>
            ) : null}
            {pullTaskConnectionPath ? (
              <svg className="move-task-connection" role="presentation">
                <path className="move-task-connection__path" d={pullTaskConnectionPath} />
              </svg>
            ) : null}
            {remoteCanvasDropConnectionPath ? (
              <svg className="move-task-connection" role="presentation">
                <path className="move-task-connection__path" d={remoteCanvasDropConnectionPath} />
              </svg>
            ) : null}
            {remoteMoveTaskConnectionPath ? (
              <svg className="move-task-connection" role="presentation">
                <path className="move-task-connection__path" d={remoteMoveTaskConnectionPath} />
              </svg>
            ) : null}
            {remotePullTaskConnectionPath ? (
              <svg className="move-task-connection" role="presentation">
                <path className="move-task-connection__path" d={remotePullTaskConnectionPath} />
              </svg>
            ) : null}
          </div>
        </div>

        <aside className={['details-panel', appMode === 'operations' && selectedSpaceAssignment?.trailer ? 'details-panel--operations-trailer' : ''].filter(Boolean).join(' ')}>
          <header className="details-panel__header">
            {appMode === 'operations' && selectedSpaceAssignment?.trailer ? (
              <>
                <h1 className="operations-panel-header__title">
                  {selectedSpaceAssignment.trailer.carrierName} #{selectedSpaceAssignment.trailer.trailerNumber}
                </h1>
                <div className="operations-panel-header__right">
                  <button className="operations-panel-header__actions" type="button">
                    <span className="operations-panel-header__actions-text">ACTIONS</span>
                    <span className="operations-panel-header__actions-chevron" aria-hidden="true">
                      <UpDownChevronIcon direction="down" className="operations-chevron-icon operations-chevron-icon--down" />
                    </span>
                  </button>
                  <button className="details-panel__close" type="button">
                    <CloseIcon className="operations-close-icon" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1>{panelTitle}</h1>
                <button className="details-panel__close" type="button">
                  <CloseIcon className="operations-close-icon" />
                </button>
              </>
            )}
          </header>

          <div className="details-panel__body">
            {appMode === 'operations' ? (
              selectedSpaceAssignment ? (
                <>
                  {selectedSpaceAssignment.trailer ? (
                    <div className="operations-trailer-panel">
                      <div className="operations-section operations-section--trailer-details">
                        <div className="operations-section__header">
                          <div className="operations-section__header-left">Trailer Details</div>
                          <div className="operations-section__header-chevron" aria-hidden="true">
                            <UpDownChevronIcon
                              direction="up"
                              className="operations-chevron-icon operations-chevron-icon--up"
                            />
                          </div>
                        </div>

                        <div className="operations-section__content">
                          <div className="operations-row">
                            <div className="operations-row__label">Trailer #:</div>
                            <div className="operations-row__value">{selectedSpaceAssignment.trailer.trailerNumber}</div>
                          </div>
                          <div className="operations-row">
                            <div className="operations-row__label">Carrier:</div>
                            <div className="operations-row__value">{selectedSpaceAssignment.trailer.carrierName}</div>
                          </div>
                          <div className="operations-row">
                            <div className="operations-row__label">USDOT #:</div>
                            <div className="operations-row__value">{selectedSpaceAssignment.trailer.usdotNumber}</div>
                          </div>
                          <div className="operations-row">
                            <div className="operations-row__label">Location:</div>
                            <div className="operations-row__value">{selectedTrailerLocationLabel}</div>
                          </div>
                          <div className="operations-row">
                            <div className="operations-row__label">Status:</div>
                            <div className="operations-row__value">{selectedTrailerStatusLabel}</div>
                          </div>
                          <div className="operations-row">
                            <div className="operations-row__label">Arrival:</div>
                            <div className="operations-row__value">{selectedSpaceAssignment.trailer.arrivalTime}</div>
                          </div>
                          <div className="operations-row">
                            <div className="operations-row__label">Driver:</div>
                            <div className="operations-row__value">{selectedSpaceAssignment.trailer.driverName}</div>
                          </div>
                          <div className="operations-row">
                            <div className="operations-row__label">Phone:</div>
                            <div className="operations-row__value">{selectedSpaceAssignment.trailer.driverPhone}</div>
                          </div>
                        </div>
                      </div>

                      {selectedMoveTaskDockAssignment ? (
                        <div className="operations-section operations-section--task-details">
                          <div className="operations-task-header">
                            <div className="operations-task-header__left">
                              <span className="operations-task-header__arrow" aria-hidden="true">
                                <DirectionalArrowIcon className="operations-directional-arrow-icon" />
                              </span>
                              <span className="operations-task-header__title">Task Details</span>
                            </div>
                            <div className="operations-task-header__dock">
                              {selectedMoveTaskDockAssignment.groupName} {selectedMoveTaskDockAssignment.slotLabel}
                            </div>
                            <div className="operations-task-header__chevron" aria-hidden="true">
                              <UpDownChevronIcon
                                direction="up"
                                className="operations-chevron-icon operations-chevron-icon--up"
                              />
                            </div>
                          </div>

                          <div className="operations-section__content operations-section__content--task">
                            <div className="operations-row">
                              <div className="operations-row__label">Assignee:</div>
                              <div className="operations-row__value">
                                {selectedSpaceAssignment.trailer.taskAssigneeName ?? selectedSpaceAssignment.trailer.driverName}
                              </div>
                            </div>
                            <div className="operations-row">
                              <div className="operations-row__label">Status:</div>
                              <div className="operations-row__value">Assigned</div>
                            </div>
                            <div className="operations-row">
                              <div className="operations-row__label">Dock Assigned:</div>
                              <div className="operations-row__value">{selectedSpaceAssignment.trailer.dockAssignmentTime}</div>
                            </div>
                            <div className="operations-row">
                              <div className="operations-row__label">Arrived at dock:</div>
                              <div className="operations-row__value">
                                {selectedSpaceAssignment.trailer.arrivedAtDockTime ?? '--'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <Field label="Availability">
                      <div className="details-panel__selection-count">No trailer assigned</div>
                    </Field>
                  )}
                </>
              ) : (
                <>
                  <Field label="Mode">
                    <div className="details-panel__selection-count">Operations mode uses mock live trailer assignments.</div>
                  </Field>
                  <div className="field-grid field-grid--three">
                    <Field label="Total">
                      <div className="details-panel__selection-count">{operationsSummary.total}</div>
                    </Field>
                    <Field label="Occupied">
                      <div className="details-panel__selection-count">{operationsSummary.occupied}</div>
                    </Field>
                    <Field label="Available">
                      <div className="details-panel__selection-count">{operationsSummary.available}</div>
                    </Field>
                  </div>
                  <Field label="Blocked">
                    <div className="details-panel__selection-count">{operationsSummary.blocked}</div>
                  </Field>
                  <Field label="Tip">
                    <div className="details-panel__selection-count">
                      Click any dock or parking space with a trailer to inspect its assigned mock data.
                    </div>
                  </Field>
                  <button
                    className={['panel-button', 'panel-button--wide'].join(' ')}
                    onClick={handleRecreateMockTrailerData}
                    type="button"
                  >
                    Recreate mock trailers
                  </button>
                </>
              )
            ) : isMultiBuildingSelection ? (
              <>
                <Field label="Selected Buildings">
                  <div className="details-panel__selection-count">{selectedBuildingIds.length} buildings</div>
                </Field>
                <button className={['panel-button', 'panel-button--wide'].join(' ')} onClick={handleCombineBuildings} type="button">
                  Combine Buildings
                </button>
              </>
            ) : selection?.type === 'row' || isDrawingRow ? (
              <>
                <Field label="Number of Spaces">
                  <input
                    min={1}
                    type="number"
                    value={selectedRow?.settings.slots ?? rowSettings.slots}
                    onChange={(event) =>
                      selectedRow
                        ? updateSelectedRowSettings({ slots: Math.max(1, Number(event.target.value) || 1) })
                        : setRowSettings((current) => ({
                            ...current,
                            slots: Math.max(1, Number(event.target.value) || 1),
                          }))
                    }
                  />
                </Field>
                <Field label="Alignment">
                  <select
                    value={selectedRow?.settings.alignment ?? rowSettings.alignment}
                    onChange={(event) =>
                      selectedRow
                        ? updateSelectedRowSettings({ alignment: event.target.value as Alignment })
                        : setRowSettings((current) => ({
                            ...current,
                            alignment: event.target.value as Alignment,
                          }))
                    }
                  >
                    <option>Left</option>
                    <option>Center</option>
                    <option>Right</option>
                  </select>
                </Field>
                <Field label="Direction">
                  <select
                    value={selectedRow?.settings.direction ?? rowSettings.direction}
                    onChange={(event) =>
                      selectedRow
                        ? updateSelectedRowSettings({ direction: event.target.value as Direction })
                        : setRowSettings((current) => ({
                            ...current,
                            direction: event.target.value as Direction,
                          }))
                    }
                  >
                    <option>Left to right</option>
                    <option>Right to left</option>
                  </select>
                </Field>
                <Field label="Side of line">
                  <select
                    value={selectedRow?.settings.side ?? rowSettings.side}
                    onChange={(event) =>
                      selectedRow
                        ? updateSelectedRowSettings({ side: event.target.value as RowSide })
                        : setRowSettings((current) => ({
                            ...current,
                            side: event.target.value as RowSide,
                          }))
                    }
                  >
                    <option>Left</option>
                    <option>Right</option>
                  </select>
                </Field>

                <div className="field-grid field-grid--two">
                  <Field label="Prefix">
                    <input
                      value={selectedRow?.settings.prefix ?? rowSettings.prefix}
                      onChange={(event) =>
                        selectedRow
                          ? updateSelectedRowSettings({ prefix: event.target.value })
                          : setRowSettings((current) => ({ ...current, prefix: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Start Number">
                    <input
                      min={1}
                      type="number"
                      value={selectedRow?.settings.startNumber ?? rowSettings.startNumber}
                      onChange={(event) =>
                        selectedRow
                          ? updateSelectedRowSettings({ startNumber: Math.max(1, Number(event.target.value) || 1) })
                          : setRowSettings((current) => ({
                              ...current,
                              startNumber: Math.max(1, Number(event.target.value) || 1),
                            }))
                      }
                    />
                  </Field>
                </div>

                <label className="toggle-row">
                  <span>Show leading zeros</span>
                  <button
                    aria-pressed={selectedRow?.settings.showLeadingZeros ?? rowSettings.showLeadingZeros}
                    className={[
                      'toggle-row__switch',
                      (selectedRow?.settings.showLeadingZeros ?? rowSettings.showLeadingZeros)
                        ? 'toggle-row__switch--active'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() =>
                      selectedRow
                        ? updateSelectedRowSettings({
                            showLeadingZeros: !(selectedRow.settings.showLeadingZeros),
                          })
                        : setRowSettings((current) => ({
                            ...current,
                            showLeadingZeros: !current.showLeadingZeros,
                          }))
                    }
                    type="button"
                  >
                    <span />
                  </button>
                </label>

                <label className="toggle-row">
                  <span>Rotate labels 180°</span>
                  <button
                    aria-pressed={selectedRow?.settings.rotateLabels ?? rowSettings.rotateLabels}
                    className={[
                      'toggle-row__switch',
                      (selectedRow?.settings.rotateLabels ?? rowSettings.rotateLabels)
                        ? 'toggle-row__switch--active'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() =>
                      selectedRow
                        ? updateSelectedRowSettings({
                            rotateLabels: !(selectedRow.settings.rotateLabels),
                          })
                        : setRowSettings((current) => ({
                            ...current,
                            rotateLabels: !current.rotateLabels,
                          }))
                    }
                    type="button"
                  >
                    <span />
                  </button>
                </label>

                <div className="field-grid field-grid--three">
                  <Field label="Width (ft)">
                    <input
                      min={1}
                      type="number"
                      value={selectedRow?.settings.width ?? rowSettings.width}
                      onChange={(event) =>
                        selectedRow
                          ? updateSelectedRowSettings({ width: Math.max(1, Number(event.target.value) || 1) })
                          : setRowSettings((current) => ({
                              ...current,
                              width: Math.max(1, Number(event.target.value) || 1),
                            }))
                      }
                    />
                  </Field>
                  <Field label="Depth (ft)">
                    <input
                      min={1}
                      type="number"
                      value={selectedRow?.settings.depth ?? rowSettings.depth}
                      onChange={(event) =>
                        selectedRow
                          ? updateSelectedRowSettings({ depth: Math.max(1, Number(event.target.value) || 1) })
                          : setRowSettings((current) => ({
                              ...current,
                              depth: Math.max(1, Number(event.target.value) || 1),
                            }))
                      }
                    />
                  </Field>
                  <Field label="Gap (ft)">
                    <input
                      min={0}
                      type="number"
                      value={selectedRow?.settings.gap ?? rowSettings.gap}
                      onChange={(event) =>
                        selectedRow
                          ? updateSelectedRowSettings({ gap: Math.max(0, Number(event.target.value) || 0) })
                          : setRowSettings((current) => ({
                              ...current,
                              gap: Math.max(0, Number(event.target.value) || 0),
                            }))
                      }
                    />
                  </Field>
                </div>
              </>
            ) : selection?.type === 'dock' || selectingEdge ? (
              <>
                <Field label="Name">
                  <input
                    value={selectedDock?.settings.name ?? dockSettings.name}
                    onChange={(event) =>
                      selectedDock
                        ? updateSelectedDockSettings({ name: event.target.value })
                        : setDockSettings((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </Field>
                <Field label="Number of Slots">
                  <input
                    min={1}
                    type="number"
                    value={selectedDock?.settings.slots ?? dockSettings.slots}
                    onChange={(event) =>
                      selectedDock
                        ? updateSelectedDockSettings({ slots: Math.max(1, Number(event.target.value) || 1) })
                        : setDockSettings((current) => ({
                            ...current,
                            slots: Math.max(1, Number(event.target.value) || 1),
                          }))
                    }
                  />
                </Field>
                <Field label="Alignment">
                  <select
                    value={selectedDock?.settings.alignment ?? dockSettings.alignment}
                    onChange={(event) =>
                      selectedDock
                        ? updateSelectedDockSettings({ alignment: event.target.value as Alignment })
                        : setDockSettings((current) => ({
                            ...current,
                            alignment: event.target.value as Alignment,
                          }))
                    }
                  >
                    <option>Left</option>
                    <option>Center</option>
                    <option>Right</option>
                  </select>
                </Field>
                <Field label="Direction">
                  <select
                    value={selectedDock?.settings.direction ?? dockSettings.direction}
                    onChange={(event) =>
                      selectedDock
                        ? updateSelectedDockSettings({ direction: event.target.value as Direction })
                        : setDockSettings((current) => ({
                            ...current,
                            direction: event.target.value as Direction,
                          }))
                    }
                  >
                    <option>Left to right</option>
                    <option>Right to left</option>
                  </select>
                </Field>

                <div className="field-grid field-grid--two">
                  <Field label="Prefix">
                    <input
                      value={selectedDock?.settings.prefix ?? dockSettings.prefix}
                      onChange={(event) =>
                        selectedDock
                          ? updateSelectedDockSettings({ prefix: event.target.value })
                          : setDockSettings((current) => ({ ...current, prefix: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Start Number">
                    <input
                      min={1}
                      type="number"
                      value={selectedDock?.settings.startNumber ?? dockSettings.startNumber}
                      onChange={(event) =>
                        selectedDock
                          ? updateSelectedDockSettings({ startNumber: Math.max(1, Number(event.target.value) || 1) })
                          : setDockSettings((current) => ({
                              ...current,
                              startNumber: Math.max(1, Number(event.target.value) || 1),
                            }))
                      }
                    />
                  </Field>
                </div>

                <label className="toggle-row">
                  <span>Show leading zeros</span>
                  <button
                    aria-pressed={selectedDock?.settings.showLeadingZeros ?? dockSettings.showLeadingZeros}
                    className={[
                      'toggle-row__switch',
                      (selectedDock?.settings.showLeadingZeros ?? dockSettings.showLeadingZeros)
                        ? 'toggle-row__switch--active'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() =>
                      selectedDock
                        ? updateSelectedDockSettings({
                            showLeadingZeros: !(selectedDock.settings.showLeadingZeros),
                          })
                        : setDockSettings((current) => ({
                            ...current,
                            showLeadingZeros: !current.showLeadingZeros,
                          }))
                    }
                    type="button"
                  >
                    <span />
                  </button>
                </label>

                <div className="field-grid field-grid--three">
                  <Field label="Width (ft)">
                    <input
                      min={1}
                      type="number"
                      value={selectedDock?.settings.width ?? dockSettings.width}
                      onChange={(event) =>
                        selectedDock
                          ? updateSelectedDockSettings({ width: Math.max(1, Number(event.target.value) || 1) })
                          : setDockSettings((current) => ({
                              ...current,
                              width: Math.max(1, Number(event.target.value) || 1),
                            }))
                      }
                    />
                  </Field>
                  <Field label="Depth (ft)">
                    <input
                      min={1}
                      type="number"
                      value={selectedDock?.settings.depth ?? dockSettings.depth}
                      onChange={(event) =>
                        selectedDock
                          ? updateSelectedDockSettings({ depth: Math.max(1, Number(event.target.value) || 1) })
                          : setDockSettings((current) => ({
                              ...current,
                              depth: Math.max(1, Number(event.target.value) || 1),
                            }))
                      }
                    />
                  </Field>
                  <Field label="Gap (ft)">
                    <input
                      min={0}
                      type="number"
                      value={selectedDock?.settings.gap ?? dockSettings.gap}
                      onChange={(event) =>
                        selectedDock
                          ? updateSelectedDockSettings({ gap: Math.max(0, Number(event.target.value) || 0) })
                          : setDockSettings((current) => ({
                              ...current,
                              gap: Math.max(0, Number(event.target.value) || 0),
                            }))
                      }
                    />
                  </Field>
                </div>

                <button
                  className={['panel-button', 'panel-button--wide'].join(' ')}
                  onClick={handleCreateBindings}
                  type="button"
                >
                  Create dock bindings
                </button>
              </>
            ) : selection?.type === 'building' ? (
              <>
                {selectedBuilding && selectedBuilding.components.length > 1 ? (
                  <>
                    <Field label="Combined Building">
                      <div className="details-panel__selection-count">
                        {isEditingCombinedBuilding
                          ? 'Editing original parts. Drag a part or its edges on the canvas.'
                          : 'Double-click the building on the canvas to edit its original parts.'}
                      </div>
                    </Field>
                    {isEditingCombinedBuilding ? (
                      <button
                        className={['panel-button', 'panel-button--wide'].join(' ')}
                        onClick={() => setEditingCombinedBuildingId(null)}
                        type="button"
                      >
                        Exit Part Edit Mode
                      </button>
                    ) : null}
                  </>
                ) : null}
                <Field label="Name">
                  <input
                    value={selectedBuilding?.settings.name ?? ''}
                    onChange={(event) => updateSelectedBuildingSettings({ name: event.target.value })}
                  />
                </Field>
                <Field label="Color">
                  <div className="color-swatch">
                    <input
                      aria-label="Building color"
                      type="color"
                      value={selectedBuilding?.settings.color ?? '#EDEDED'}
                      onChange={(event) => updateSelectedBuildingSettings({ color: event.target.value })}
                    />
                  </div>
                </Field>
                <div className="field-grid field-grid--two">
                  <Field label="X">
                    <input
                      min={0}
                      type="number"
                      value={Math.round(selectedBuilding?.rect.x ?? 0)}
                      onChange={(event) =>
                        updateSelectedBuildingRect({ x: Math.max(0, Number(event.target.value) || 0) })
                      }
                    />
                  </Field>
                  <Field label="Y">
                    <input
                      min={0}
                      type="number"
                      value={Math.round(selectedBuilding?.rect.y ?? 0)}
                      onChange={(event) =>
                        updateSelectedBuildingRect({ y: Math.max(0, Number(event.target.value) || 0) })
                      }
                    />
                  </Field>
                </div>
                <Field label="Rotation (deg)">
                  <input
                    type="number"
                    value={selectedBuilding?.settings.angle ?? 0}
                    onChange={(event) =>
                      updateSelectedBuildingSettings({ angle: Number(event.target.value) || 0 })
                    }
                  />
                </Field>
                <div className="field-grid field-grid--two">
                  <Field label="Width">
                    <input
                      min={1}
                      type="number"
                      value={Math.round(selectedBuilding?.rect.width ?? 1)}
                      onChange={(event) =>
                        updateSelectedBuildingRect({ width: Math.max(1, Number(event.target.value) || 1) })
                      }
                    />
                  </Field>
                  <Field label="Height">
                    <input
                      min={1}
                      type="number"
                      value={Math.round(selectedBuilding?.rect.height ?? 1)}
                      onChange={(event) =>
                        updateSelectedBuildingRect({ height: Math.max(1, Number(event.target.value) || 1) })
                      }
                    />
                  </Field>
                </div>
              </>
            ) : (
              <>
                <Field label="Location name">
                  <input
                    aria-label="Location name"
                    type="text"
                    value={canvasLocationName}
                    onChange={(event) => setCanvasLocationName(event.target.value)}
                  />
                </Field>
                <Field label="Background Color">
                  <div className="color-swatch">
                    <input
                      aria-label="Canvas background color"
                      type="color"
                      value={canvasBackgroundColor}
                      onChange={(event) => setCanvasBackgroundColor(event.target.value)}
                    />
                  </div>
                </Field>
              </>
            )}
          </div>

          <footer className="details-panel__footer">
            {appMode === 'build' && (selection?.type === 'row' || selection?.type === 'dock' || selection?.type === 'building') ? (
              <button
                aria-label={
                  selection.type === 'row'
                    ? 'Delete row'
                    : selection.type === 'dock'
                      ? 'Delete dock row'
                      : 'Delete building'
                }
                className={['panel-button', 'panel-button--danger', 'panel-button--icon'].join(' ')}
                onClick={() => {
                  if (selection?.type === 'row' && selectedRow) {
                    setRows((current) => current.filter((row) => row.id !== selectedRow.id));
                    setMoveTaskSelectionOverride(null);
                    setSelection(null);
                    return;
                  }

                  if (selection?.type === 'dock' && selectedBuilding && selectedDock) {
                    updateBuilding(selectedBuilding.id, (building) => ({
                      ...building,
                      docks: building.docks.filter((dock) => dock.id !== selectedDock.id),
                    }));
                    setSelection({ buildingId: selectedBuilding.id, type: 'building' });
                    return;
                  }

                  if (selection?.type === 'building' && selectedBuilding) {
                    setBuildings((current) => current.filter((building) => building.id !== selectedBuilding.id));
                    setSelectedBuildingIds((current) => current.filter((id) => id !== selectedBuilding.id));
                    setMoveTaskSelectionOverride(null);
                    setSelection(null);
                    setEditingCombinedBuildingId(null);
                  }
                }}
                type="button"
              >
                <svg aria-hidden="true" className="panel-button__icon" viewBox="0 0 24 24">
                  <path
                    d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 10h2v8H7v-8Zm-1 12V8h12v14H6Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            ) : (
              <span />
            )}
            {appMode === 'build' && !selectingEdge && !isDrawingRow && !isDrawingBuilding && !selection && remoteCanvasSnapshots.length >= 1 ? (
              <button
                aria-label="Delete location"
                className={['panel-button', 'panel-button--danger', 'panel-button--icon'].join(' ')}
                onClick={handleDeleteActiveLocation}
                type="button"
              >
                <svg aria-hidden="true" className="panel-button__icon" viewBox="0 0 24 24">
                  <path
                    d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 10h2v8H7v-8Zm-1 12V8h12v14H6Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            ) : (
              <span />
            )}
          </footer>
        </aside>
      </section>
      {isDockBindingsModalOpen ? (
        <div className="dock-bindings-modal" role="dialog" aria-modal="true" aria-label="Create dock bindings">
          <div className="dock-bindings-modal__backdrop" onClick={handleDockBindingsCancel} />
          <div className="dock-bindings-modal__panel">
            <div className="dock-bindings-modal__header">
              <h2 className="dock-bindings-modal__title">Create dock bindings</h2>
              <button
                className="dock-bindings-modal__close"
                type="button"
                aria-label="Close dock bindings"
                onClick={handleDockBindingsCancel}
              >
                ×
              </button>
            </div>
            <p className="dock-bindings-modal__description">
              Unchecked positions are treated as parking spaces (no door icon).
            </p>
            <div className="dock-bindings-modal__list" role="group" aria-label="Dock positions">
              {dockBindingEntries.map((entry) => (
                <label key={entry.spaceKey} className="dock-bindings-modal__row">
                  <span className="dock-bindings-modal__row-label">{entry.slotLabel}</span>
                  <input
                    type="checkbox"
                    checked={entry.enabled}
                    onChange={(event) => handleDockBindingToggle(entry.spaceKey, event.target.checked)}
                  />
                </label>
              ))}
            </div>
            <div className="dock-bindings-modal__actions">
              <button className={['panel-button', 'panel-button--ghost'].join(' ')} onClick={handleDockBindingsCancel} type="button">
                Cancel
              </button>
              <button className="panel-button" onClick={handleDockBindingsApply} type="button">
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {dragPreviewAssignment && dragPreviewEdge && spaceDrag ? (
        <div
          className={[
            'space-drag-preview',
            dragPreviewAssignment.type === 'dock' &&
            (
              dragPreviewAssignment.state === 'move-task' ||
              dragPreviewAssignment.state === 'pull-task' ||
              dragPreviewAssignment.state === 'issue'
            )
              ? 'space-drag-preview--crop-dock-icon'
              : '',
          ].filter(Boolean).join(' ')}
          style={{
            left: `${spaceDrag.pointerX}px`,
            top: `${spaceDrag.pointerY}px`,
            transform: `translate(-50%, -50%) rotate(${dragPreviewFollowsSourceAngle ? spaceDrag.sourceAngle : dragPreviewAngleOverride ?? 0}deg)`,
          }}
        >
          <Dock
            draggable={false}
            edge={dragPreviewEdge}
            label={dragPreviewAssignment.slotLabel}
            selected={false}
            state={dragPreviewAssignment.state}
            trailerNumber={dragPreviewAssignment.trailer?.trailerNumber ?? null}
            type={dragPreviewAssignment.type}
          />
        </div>
      ) : null}
      {dragReturnPreview ? (
        <div
          className={[
            'space-drag-preview',
            'space-drag-preview--returning',
            dragReturnActive ? 'space-drag-preview--returning-active' : '',
            dragReturnPreview.assignment.type === 'dock' &&
            (
              dragReturnPreview.assignment.state === 'move-task' ||
              dragReturnPreview.assignment.state === 'pull-task' ||
              dragReturnPreview.assignment.state === 'issue'
            )
              ? 'space-drag-preview--crop-dock-icon'
              : '',
          ].join(' ')}
          style={{
            left: `${dragReturnActive ? dragReturnPreview.toX : dragReturnPreview.fromX}px`,
            top: `${dragReturnActive ? dragReturnPreview.toY : dragReturnPreview.fromY}px`,
            transform: `translate(-50%, -50%) rotate(${dragReturnPreview.sourceAngle}deg)`,
          }}
        >
          <Dock
            draggable={false}
            edge={dragReturnPreview.edge}
            label={dragReturnPreview.assignment.slotLabel}
            selected={false}
            state={dragReturnPreview.assignment.state}
            trailerNumber={dragReturnPreview.assignment.trailer?.trailerNumber ?? null}
            type={dragReturnPreview.assignment.type}
          />
        </div>
      ) : null}

      {operationsTrailerActionModal ? (
        <div
          className="move-task-popover"
          style={{
            left:
              (() => {
                const bounds = spaceRefs.current[operationsTrailerActionModal.spaceKey]?.getBoundingClientRect();
                if (!bounds) return 0;
                return bounds.left + bounds.width / 2;
              })(),
            top:
              (() => {
                const bounds = spaceRefs.current[operationsTrailerActionModal.spaceKey]?.getBoundingClientRect();
                if (!bounds) return 0;
                return bounds.top - 14;
              })(),
          }}
        >
          <div className="move-task-popover__title">{operationsTrailerActionModal.trailerNumber}</div>
          <div className="move-task-popover__meta">{operationsTrailerActionModal.carrierName}</div>
          <button
            className="move-task-popover__action"
            onClick={(event) => {
              event.stopPropagation();
              if (operationsTrailerActionModal.action === 'complete_move') {
                handleCompleteMoveFromDestinationModal();
                return;
              }
              if (operationsTrailerActionModal.action === 'complete_pull') {
                handleCompletePullFromDestinationModal();
                return;
              }
              if (operationsTrailerActionModal.action === 'cancel_pull') {
                handleCancelPullFromSourceModal();
                return;
              }

              handleCheckOutFromParkingModal();
            }}
            type="button"
          >
            {operationsTrailerActionModal.action === 'complete_move' || operationsTrailerActionModal.action === 'complete_pull'
              ? 'Complete Move'
              : operationsTrailerActionModal.action === 'cancel_pull'
                ? 'Cancel Move'
                : 'Check Out'}
          </button>
        </div>
      ) : null}

      {selectedYardMoveTaskAssignment &&
      selectedYardMoveTaskBounds &&
      !operationsTrailerActionModal &&
      (hoveredSpaceKey === selectedYardMoveTaskAssignment.key || isMoveTaskPopoverHovered) ? (
        <div
          className="move-task-popover"
          onMouseEnter={() => {
            if (hoverClearTimeoutRef.current) {
              window.clearTimeout(hoverClearTimeoutRef.current);
              hoverClearTimeoutRef.current = null;
            }
            setIsMoveTaskPopoverHovered(true);
          }}
          onMouseLeave={() => setIsMoveTaskPopoverHovered(false)}
          style={{
            left: `${selectedYardMoveTaskBounds.left + selectedYardMoveTaskBounds.width / 2}px`,
            top: `${selectedYardMoveTaskBounds.top - 14}px`,
          }}
        >
          <div className="move-task-popover__title">{selectedYardMoveTaskAssignment.trailer!.trailerNumber}</div>
          <div className="move-task-popover__meta">{selectedYardMoveTaskAssignment.trailer!.carrierName}</div>
          <button
            className="move-task-popover__action"
            onClick={(event) => {
              event.stopPropagation();
              handleCancelMoveTask(selectedYardMoveTaskAssignment.trailer!.trailerNumber);
            }}
            type="button"
          >
            Cancel move
          </button>
        </div>
      ) : null}
      {selectedDockAvailabilityAssignment &&
      selectedDockAvailabilityBounds &&
      !operationsTrailerActionModal &&
      (hoveredSpaceKey === selectedDockAvailabilityAssignment.key || isMoveTaskPopoverHovered) ? (
        <div
          className="move-task-popover"
          onMouseEnter={() => {
            if (hoverClearTimeoutRef.current) {
              window.clearTimeout(hoverClearTimeoutRef.current);
              hoverClearTimeoutRef.current = null;
            }
            setIsMoveTaskPopoverHovered(true);
          }}
          onMouseLeave={() => setIsMoveTaskPopoverHovered(false)}
          style={{
            left: `${selectedDockAvailabilityBounds.left + selectedDockAvailabilityBounds.width / 2}px`,
            top: `${selectedDockAvailabilityBounds.top - 14}px`,
          }}
        >
          <div className="move-task-popover__title">{selectedDockAvailabilityAssignment.slotLabel}</div>
          <div className="move-task-popover__meta">{selectedDockAvailabilityAssignment.groupName}</div>
          <button
            className="move-task-popover__action"
            onClick={(event) => {
              event.stopPropagation();
              handleDockAvailabilityToggle(
                selectedDockAvailabilityAssignment.key,
                selectedDockAvailabilityAssignment.state === 'blocked' ? 'default' : 'blocked'
              );
            }}
            type="button"
          >
            {selectedDockAvailabilityAssignment.state === 'blocked' ? 'Unblock dock' : 'Block dock'}
          </button>
        </div>
      ) : null}
      {selectedInProgressAssignment &&
      selectedInProgressBounds &&
      !operationsTrailerActionModal &&
      (hoveredSpaceKey === selectedInProgressAssignment.key || isMoveTaskPopoverHovered) ? (
        <div
          className="move-task-popover"
          onMouseEnter={() => {
            if (hoverClearTimeoutRef.current) {
              window.clearTimeout(hoverClearTimeoutRef.current);
              hoverClearTimeoutRef.current = null;
            }
            setIsMoveTaskPopoverHovered(true);
          }}
          onMouseLeave={() => setIsMoveTaskPopoverHovered(false)}
          style={{
            left: `${selectedInProgressBounds.left + selectedInProgressBounds.width / 2}px`,
            top: `${selectedInProgressBounds.top - 14}px`,
          }}
        >
          <div className="move-task-popover__title">{selectedInProgressAssignment.trailer!.trailerNumber}</div>
          <div className="move-task-popover__meta">{selectedInProgressAssignment.trailer!.carrierName}</div>
          <button
            className="move-task-popover__action"
            onClick={(event) => {
              event.stopPropagation();
              handleEndSession(selectedInProgressAssignment.key);
            }}
            type="button"
          >
            End Session
          </button>
        </div>
      ) : null}
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__control">{children}</span>
    </label>
  );
}

function Dock({
  controlRef,
  draggable = false,
  dropHovered = false,
  edge,
  hideMoveIndicator = false,
  indicatorRef,
  label,
  onDrag,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
  onClick,
  onHoverEnter,
  onHoverLeave,
  rotateLabel = false,
  selected = false,
  showDoor = true,
  suggestionTier = null,
  spaceRef,
  state = 'default',
  trailerNumber,
  type = 'dock',
  remoteMoveTaskRole = null,
}: {
  controlRef?: (node: HTMLSpanElement | null) => void;
  draggable?: boolean;
  dropHovered?: boolean;
  edge: Edge;
  hideMoveIndicator?: boolean;
  indicatorRef?: (node: HTMLSpanElement | null) => void;
  label: string;
  onDrag?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onClick?: () => void;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  rotateLabel?: boolean;
  selected?: boolean;
  showDoor?: boolean;
  spaceRef?: (node: HTMLDivElement | null) => void;
  state?: SpaceVisualState;
  trailerNumber?: string | null;
  type?: 'dock' | 'yard';
  remoteMoveTaskRole?: 'source' | 'destination' | null;
  suggestionTier?: DockSuggestionTier | null;
}) {
  const hasTrailer = Boolean(trailerNumber);
  const showOpenDoor = hasTrailer && state !== 'move-task' && state !== 'pull-task';
  const showArrow = state === 'move-task' || state === 'pull-task';
  const showCurveControl = state === 'move-task' || state === 'pull-task';
  const shouldVisuallyHidePullTaskArrow = state === 'pull-task' && selected;
  const arrowRotationClass =
    state === 'pull-task'
      ? type === 'dock'
        ? 'dock__indicator--arrow-yard'
        : 'dock__indicator--arrow-dock'
      : type === 'dock'
        ? 'dock__indicator--arrow-dock'
        : 'dock__indicator--arrow-yard';

  const suggestionText =
    '';

  const suggestionClassSuffix = suggestionTier === 'dont_use' ? 'dont-use' : suggestionTier;

  return (
    <div
      className={[
        'dock',
        `dock--${edge}`,
        `dock--kind-${type}`,
        `dock--state-${state}`,
        selected ? 'dock--status-selected' : 'dock--status-default',
        remoteMoveTaskRole === 'destination'
          ? 'dock--remote-move-destination'
          : remoteMoveTaskRole === 'source'
            ? 'dock--remote-move-source'
            : '',
        onClick ? 'dock--interactive' : '',
        draggable ? 'dock--draggable' : '',
        onDrop ? 'dock--drop-target' : '',
        dropHovered ? 'dock--drop-hovered' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={spaceRef}
      draggable={draggable}
      onClick={(event) => {
        if (onClick) {
          event.stopPropagation();
          onClick();
        }
      }}
      onDragEnd={() => {
        onDragEnd?.();
      }}
      onDrag={(event) => {
        onDrag?.(event);
      }}
      onDragOver={(event) => {
        onDragOver?.(event);
      }}
      onDragLeave={(event) => {
        onDragLeave?.(event);
      }}
      onDragStart={(event) => {
        onDragStart?.(event);
      }}
      onDrop={(event) => {
        onDrop?.(event);
      }}
      onMouseDown={(event) => {
        if (onClick) {
          event.stopPropagation();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={trailerNumber ? `${label} • ${trailerNumber}` : label}
      onMouseEnter={() => {
        onHoverEnter?.();
      }}
      onMouseLeave={() => {
        onHoverLeave?.();
      }}
    >
      <div className="dock__inner">
        <div className="dock__head">
          <span className="dock__head-frame" />
          <span className={['dock__label', rotateLabel ? 'dock__label--rotated' : ''].filter(Boolean).join(' ')}>
            {label}
          </span>
        </div>
        <div className="dock__body">
          {type === 'dock' && showDoor ? (
            <span className={['dock__indicator', 'dock__indicator--door'].join(' ')}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="dock__indicator-icon">
                {showOpenDoor ? (
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M21 21V3C21 2.448 20.553 2 20 2H4C3.448 2 3 2.448 3 3V21C3 21.553 3.448 22 4 22H6C6.552 22 7 21.553 7 21C7 20.447 6.552 20 6 20H5V4H19V20H18C17.447 20 17 20.447 17 21C17 21.553 17.447 22 18 22H20C20.553 22 21 21.553 21 21ZM18 6C18 5.448 17.553 5 17 5H7C6.448 5 6 5.448 6 6C6 6.552 6.448 7 7 7H17C17.553 7 18 6.552 18 6ZM18 9C18 8.448 17.553 8 17 8H7C6.448 8 6 8.448 6 9C6 9.552 6.448 10 7 10H17C17.553 10 18 9.552 18 9Z"
                    fill="currentColor"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M21 21V3C21 2.448 20.553 2 20 2H4C3.448 2 3 2.448 3 3V21C3 21.553 3.448 22 4 22H6C6.552 22 7 21.553 7 21C7 20.447 6.552 20 6 20H5V4H19V20H18C17.447 20 17 20.447 17 21C17 21.553 17.447 22 18 22H20C20.553 22 21 21.553 21 21ZM18 6C18 5.448 17.553 5 17 5H7C6.448 5 6 5.448 6 6C6 6.552 6.448 7 7 7H17C17.553 7 18 6.552 18 6ZM18 9C18 8.448 17.553 8 17 8H7C6.448 8 6 8.448 6 9C6 9.552 6.448 10 7 10H17C17.553 10 18 9.552 18 9ZM18 12C18 11.448 17.553 11 17 11H7C6.448 11 6 11.448 6 12C6 12.552 6.448 13 7 13H17C17.553 13 18 12.552 18 12ZM18 15C18 14.448 17.553 14 17 14H7C6.448 14 6 14.448 6 15C6 15.552 6.448 16 7 16H17C17.553 16 18 15.552 18 15ZM18 18C18 17.448 17.553 17 17 17H7C6.448 17 6 17.448 6 18C6 18.552 6.448 19 7 19H17C17.553 19 18 18.552 18 18Z"
                    fill="currentColor"
                  />
                )}
              </svg>
            </span>
          ) : null}
          {trailerNumber ? (
            <span className={['dock__trailer', rotateLabel ? 'dock__trailer--rotated' : ''].filter(Boolean).join(' ')}>
              {trailerNumber}
            </span>
          ) : suggestionTier ? (
            <span
              className={[
                'dock__trailer',
                rotateLabel ? 'dock__trailer--rotated' : '',
                `dock__trailer--suggestion-${suggestionClassSuffix}`,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {suggestionText}
            </span>
          ) : null}
          {showArrow ? (
            <span
              className={[
                'dock__indicator',
                'dock__indicator--arrow',
                arrowRotationClass,
                shouldVisuallyHidePullTaskArrow ? 'dock__indicator--hidden' : '',
                hideMoveIndicator ? 'dock__indicator--hidden' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              ref={indicatorRef}
            >
              ↓
            </span>
          ) : null}
          {showCurveControl ? (
            <span aria-hidden="true" className="dock__curve-control" ref={controlRef} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ParkingRowView({
  appMode,
  dockSuggestionBySpaceKey = {},
  draggedSpaceKey,
  isPreview,
  onHandleStart,
  onMoveStart,
  onSpaceDragEnd,
  onSpaceDragMove,
  onSpaceDragStart,
  onSpaceDragPreview,
  onSelect,
  onSpaceSelect,
  onSpaceHoverEnter,
  onSpaceHoverLeave,
  operationsAssignments,
  registerSpaceControlRef,
  registerSpaceIndicatorRef,
  registerSpaceRef,
  row,
  selected,
  selectedMoveTaskSpaceKeys,
  selectedMoveTaskTrailerNumber,
  selectedPullTaskTrailerNumber,
  selectedSpaceKey,
  dockDragHover,
  onCompleteToYardDragOver,
  onCompleteToYardDragLeave,
  onCompleteToYardDrop,
}: {
  appMode: AppMode;
  dockSuggestionBySpaceKey?: Record<string, DockSuggestionTier>;
  draggedSpaceKey: string | null;
  isPreview: boolean;
  onHandleStart: (event: React.MouseEvent<HTMLButtonElement>, row: ParkingRow, handle: 'start' | 'end') => void;
  onMoveStart: (event: React.MouseEvent<HTMLDivElement>, row: ParkingRow) => void;
  onSpaceDragEnd: () => void;
  onSpaceDragMove: (event: React.DragEvent<HTMLDivElement>) => void;
  onSpaceDragStart: (
    spaceKey: string,
    sourceEdge: Edge,
    sourceAngle: number,
    pointer: { x: number; y: number }
  ) => boolean;
  onSpaceDragPreview: (event: React.DragEvent<HTMLDivElement>) => void;
  onSelect: () => void;
  onSpaceSelect: (spaceKey: string) => void;
  onSpaceHoverEnter: (spaceKey: string) => void;
  onSpaceHoverLeave: (spaceKey: string) => void;
  operationsAssignments: OperationsAssignments;
  registerSpaceControlRef: (spaceKey: string, node: HTMLSpanElement | null) => void;
  registerSpaceIndicatorRef: (spaceKey: string, node: HTMLSpanElement | null) => void;
  registerSpaceRef: (spaceKey: string, node: HTMLDivElement | null) => void;
  row: ParkingRow;
  selected: boolean;
  selectedMoveTaskSpaceKeys: Set<string>;
  selectedMoveTaskTrailerNumber: string | null;
  selectedPullTaskTrailerNumber: string | null;
  selectedSpaceKey: string | null;
  dockDragHover?: DockDragHover | null;
  onCompleteToYardDragOver?: (
    event: React.DragEvent<HTMLDivElement>,
    spaceKey: string,
    rowEdge: Edge,
    rowAngle: number
  ) => void;
  onCompleteToYardDragLeave?: (spaceKey: string) => void;
  onCompleteToYardDrop?: (event: React.DragEvent<HTMLDivElement>, spaceKey: string) => void;
}) {
  const metrics = getLineMetrics(row.start, row.end);
  const rowEdge = row.settings.side === 'Left' ? 'top' : 'bottom';
  const slotLabels = getDockNumbers({
    ...row.settings,
    name: '',
  });

  if (metrics.length < 1) {
    return null;
  }

  return (
    <div
      className={[
        'parking-row',
        selected ? 'parking-row--selected' : '',
        isPreview ? 'parking-row--preview' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: `${row.start.x}px`,
        top: `${row.start.y}px`,
        transform: `rotate(${metrics.angle}deg)`,
        width: `${metrics.length}px`,
      }}
    >
      <div className="parking-row__line" />
      <div
        className={[
          'parking-row__alignment',
          `parking-row__alignment--${row.settings.alignment.toLowerCase()}`,
        ].join(' ')}
        onMouseDown={(event) => {
          if (!isPreview && appMode === 'build') {
            onMoveStart(event, row);
          }
        }}
      >
        <div
          className={[
            'parking-row__pack',
            `parking-row__pack--${row.settings.side.toLowerCase()}`,
          ].join(' ')}
          onMouseDown={(event) => {
            if (!isPreview && appMode === 'build') {
              event.preventDefault();
              onMoveStart(event, row);
            }
          }}
          onClick={(event) => {
            if (!isPreview && appMode === 'build') {
              event.stopPropagation();
              onSelect();
            }
          }}
        >
          <div className="parking-row__slots">
            {slotLabels.map((slot) => {
              const spaceKey = getRowSpaceKey(row.id, slot);
              const assignment = operationsAssignments[spaceKey];
              const visualState = appMode === 'operations' ? assignment?.state ?? 'default' : 'default';
              const trailerNumber = appMode === 'operations' ? assignment?.trailer?.trailerNumber ?? null : null;

              return (
                <Dock
                  controlRef={(node) => registerSpaceControlRef(spaceKey, node)}
                  draggable={
                    appMode === 'operations' &&
                    assignment?.type === 'yard' &&
                    Boolean(assignment?.trailer) &&
                    assignment?.state !== 'pull-task'
                  }
                  edge={rowEdge}
                  dropHovered={dockDragHover?.spaceKey === spaceKey}
                  hideMoveIndicator={selectedMoveTaskSpaceKeys.has(spaceKey)}
                  indicatorRef={(node) => registerSpaceIndicatorRef(spaceKey, node)}
                  key={`${row.id}-${slot}`}
                  label={slot}
                  remoteMoveTaskRole={appMode === 'operations' ? assignment?.remoteMoveTaskRole ?? null : null}
                  onDrag={onSpaceDragMove}
                  onDragEnd={onSpaceDragEnd}
                  onDragLeave={() => onCompleteToYardDragLeave?.(spaceKey)}
                  onDragOver={(event) => onCompleteToYardDragOver?.(event, spaceKey, rowEdge, metrics.angle)}
                  onDragStart={(event) => {
                    const allowed = onSpaceDragStart(spaceKey, rowEdge, metrics.angle, {
                      x: event.clientX,
                      y: event.clientY,
                    });

                    if (!allowed) {
                      event.preventDefault();
                      return;
                    }

                    event.stopPropagation();
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', spaceKey);
                    onSpaceDragPreview(event);
                  }}
                  onClick={appMode === 'operations' ? () => onSpaceSelect(spaceKey) : undefined}
                  onHoverEnter={() => onSpaceHoverEnter(spaceKey)}
                  onHoverLeave={() => onSpaceHoverLeave(spaceKey)}
                  onDrop={(event) => onCompleteToYardDrop?.(event, spaceKey)}
                  rotateLabel={row.settings.rotateLabels}
                  selected={
                    draggedSpaceKey === spaceKey ||
                    selectedSpaceKey === spaceKey ||
                    (selectedMoveTaskTrailerNumber !== null &&
                      assignment?.state === 'move-task' &&
                      assignment.trailer?.trailerNumber === selectedMoveTaskTrailerNumber)
                    ||
                    (selectedPullTaskTrailerNumber !== null &&
                      assignment?.state === 'pull-task' &&
                      assignment.trailer?.trailerNumber === selectedPullTaskTrailerNumber)
                  }
                  spaceRef={(node) => registerSpaceRef(spaceKey, node)}
                  state={visualState}
                  suggestionTier={dockSuggestionBySpaceKey[spaceKey] ?? null}
                  trailerNumber={trailerNumber}
                  type="yard"
                />
              );
            })}
          </div>
        </div>
      </div>
      {selected && !isPreview && appMode === 'build' ? (
        <>
          <button
            aria-label="Move row start point"
            className="parking-row__handle parking-row__handle--start"
            onMouseDown={(event) => onHandleStart(event, row, 'start')}
            type="button"
          />
          <button
            aria-label="Move row end point"
            className="parking-row__handle parking-row__handle--end"
            onMouseDown={(event) => onHandleStart(event, row, 'end')}
            type="button"
          />
        </>
      ) : null}
    </div>
  );
}

export default App;
