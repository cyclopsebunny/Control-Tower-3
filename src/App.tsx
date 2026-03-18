import React, { useEffect, useRef, useState } from 'react';
import '../tokens/tokens.css';
import './index.css';
import './facilityPrototype.css';

type Edge = 'top' | 'right' | 'bottom' | 'left';
type Alignment = 'Left' | 'Center' | 'Right';
type Direction = 'Left to right' | 'Right to left';
type RowSide = 'Left' | 'Right';
type AppMode = 'build' | 'operations';
type SpaceVisualState = 'default' | 'occupied' | 'move-task' | 'in-progress' | 'issue' | 'blocked';

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
  trailerNumber: string;
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

type DockDragHover = {
  edge: Edge;
  spaceKey: string;
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

type FacilityDocument = {
  appMode?: AppMode;
  canvasBackgroundColor?: string;
  buildings: BuildingItem[];
  idCounter: number;
  operationsAssignments?: OperationsAssignments;
  rows: ParkingRow[];
  viewport: CanvasViewport;
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
    trailerNumber: `T-${String(111111 + index * 111).padStart(6, '0')}`,
    usdotNumber: String(1000000 + index * 347),
  };
}

function buildOperationsAssignments(buildings: BuildingItem[], rows: ParkingRow[]) {
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
  const pairedMoveTasks = Math.min(4, dockSlots.length, rowSlots.length);

  for (let index = 0; index < pairedMoveTasks; index += 1) {
    const trailer = createMockTrailer(trailerIndex++);
    const dockSlot = dockSlots[index];
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
  const [moveTaskConnectionRefresh, setMoveTaskConnectionRefresh] = useState(0);
  const [spaceDrag, setSpaceDrag] = useState<SpaceDrag | null>(null);
  const [dockDragHover, setDockDragHover] = useState<DockDragHover | null>(null);
  const [dragPreviewEdge, setDragPreviewEdge] = useState<Edge | null>(null);
  const [dragPreviewFollowsSourceAngle, setDragPreviewFollowsSourceAngle] = useState(true);
  const [dragReturnPreview, setDragReturnPreview] = useState<DragReturnPreview | null>(null);
  const [dragReturnActive, setDragReturnActive] = useState(false);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#eaeaea');
  const [viewport, setViewport] = useState<CanvasViewport>({ scale: 1, x: 0, y: 0 });
  const [canvasPan, setCanvasPan] = useState<CanvasPan | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [buildingSettings, setBuildingSettings] = useState(buildingDefaults);
  const [dockSettings, setDockSettings] = useState(dockDefaults);
  const [rowSettings, setRowSettings] = useState(rowDefaults);

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
    canvasBackgroundColor,
    buildings,
    idCounter: idRef.current,
    operationsAssignments: mode === 'operations' ? operationsAssignments : {},
    rows,
    viewport,
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
    setBuildings([]);
    setRows([]);
    setOperationsAssignments({});
    setCanvasBackgroundColor('#eaeaea');
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
      const nextBuildings = Array.isArray(doc.buildings) ? doc.buildings : [];
      const nextRows = Array.isArray(doc.rows) ? doc.rows : [];
      const nextMode = doc.appMode === 'operations' ? 'operations' : 'build';

      setAppMode(nextMode);
      setCanvasBackgroundColor(doc.canvasBackgroundColor ?? '#eaeaea');
      setBuildings(nextBuildings);
      setOperationsAssignments(
        doc.operationsAssignments ?? (nextMode === 'operations' ? buildOperationsAssignments(nextBuildings, nextRows) : {})
      );
      setRows(nextRows);
      setViewport(doc.viewport ?? { scale: 1, x: 0, y: 0 });
      idRef.current = typeof doc.idCounter === 'number' ? doc.idCounter : 1;
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
    setSpaceDrag(null);
    setEditingCombinedBuildingId(null);
    setCanvasPan(null);
    buildingPointerDownRef.current = false;
    buildingDragDrawRef.current = false;
    skipCanvasClickRef.current = false;
  };

  const handleModeChange = (nextMode: AppMode) => {
    if (nextMode === appMode) {
      return;
    }

    resetInteractions();
    setSelection(null);

    if (nextMode === 'operations') {
      setOperationsAssignments(buildOperationsAssignments(buildings, rows));
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
    return;
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
        (assignment.type === 'yard' && assignment.state !== 'move-task') ||
        (assignment.type === 'dock' && assignment.state === 'move-task')
      )
    ) {
      return false;
    }

    setSpaceDrag({ pointerX: pointer.x, pointerY: pointer.y, sourceAngle, sourceSpaceKey: spaceKey });
    setDragPreviewEdge(sourceEdge);
    setDragPreviewFollowsSourceAngle(true);
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
        setDragReturnActive(false);
        setDragReturnPreview({
          assignment: dragPreviewAssignment,
          edge: dragPreviewEdge,
          fromX: spaceDrag.pointerX,
          fromY: spaceDrag.pointerY,
          sourceAngle: dragPreviewFollowsSourceAngle ? spaceDrag.sourceAngle : 0,
          toX: sourceBounds.left + sourceBounds.width / 2,
          toY: sourceBounds.top + sourceBounds.height / 2,
        });
      }
    }

    dropSucceededRef.current = false;
    setDockDragHover(null);
    setDragPreviewEdge(null);
    setDragPreviewFollowsSourceAngle(true);
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
    const sourceIsDockReassign =
      sourceAssignment?.type === 'dock' && sourceAssignment.state === 'move-task' && Boolean(sourceAssignment.trailer);

    if (
      !sourceSpaceKey ||
      sourceSpaceKey === targetSpaceKey ||
      !sourceAssignment?.trailer ||
      (!sourceIsNewMoveTask && !sourceIsDockReassign) ||
      !targetAssignment ||
      targetAssignment.type !== 'dock' ||
      targetAssignment.state !== 'default'
    ) {
      setDockDragHover(null);
      setDragPreviewEdge(null);
      setSpaceDrag(null);
      return;
    }

    setOperationsAssignments((current) => {
      const nextSourceAssignment = current[sourceSpaceKey];
      const nextTargetAssignment = current[targetSpaceKey];

      if (
        !nextSourceAssignment?.trailer ||
        !(
          (nextSourceAssignment.type === 'yard' && nextSourceAssignment.state !== 'move-task') ||
          (nextSourceAssignment.type === 'dock' && nextSourceAssignment.state === 'move-task')
        ) ||
        !nextTargetAssignment ||
        nextTargetAssignment.type !== 'dock' ||
        nextTargetAssignment.state !== 'default'
      ) {
        return current;
      }

      if (nextSourceAssignment.type === 'yard') {
        return {
          ...current,
          [sourceSpaceKey]: {
            ...nextSourceAssignment,
            state: 'move-task',
          },
          [targetSpaceKey]: {
            ...nextTargetAssignment,
            state: 'move-task',
            trailer: nextSourceAssignment.trailer,
          },
        };
      }

      return {
        ...current,
        [sourceSpaceKey]: {
          ...nextSourceAssignment,
          state: 'default',
          trailer: null,
        },
        [targetSpaceKey]: {
          ...nextTargetAssignment,
          state: 'move-task',
          trailer: nextSourceAssignment.trailer,
        },
      };
    });
    setMoveTaskSelectionOverride(sourceAssignment.trailer.trailerNumber);
    skipNextSpaceSelectClearRef.current = true;
    setSelection({ spaceKey: targetSpaceKey, type: 'space' });
    dropSucceededRef.current = true;
    setDockDragHover(null);
    setDragPreviewEdge(null);
    setDragPreviewFollowsSourceAngle(true);
    setSpaceDrag(null);
  };

  const handleSpaceSelect = (spaceKey: string) => {
    const assignment = operationsAssignments[spaceKey];

    if (skipNextSpaceSelectClearRef.current) {
      skipNextSpaceSelectClearRef.current = false;
    } else if (assignment?.state === 'move-task' && assignment.trailer?.trailerNumber) {
      setMoveTaskSelectionOverride(assignment.trailer.trailerNumber);
    } else {
      setMoveTaskSelectionOverride(null);
    }

    setSelection({ spaceKey, type: 'space' });
  };

  const handleCancelMoveTask = (trailerNumber: string) => {
    setOperationsAssignments((current) => {
      const next: OperationsAssignments = { ...current };

      Object.values(current).forEach((assignment) => {
        if (assignment.state !== 'move-task' || assignment.trailer?.trailerNumber !== trailerNumber) {
          return;
        }

        next[assignment.key] =
          assignment.type === 'yard'
            ? {
                ...assignment,
                state: 'occupied',
              }
            : {
                ...assignment,
                state: 'default',
                trailer: null,
              };
      });

      return next;
    });

    if (selection?.type === 'space') {
      const selectedAssignment = operationsAssignments[selection.spaceKey];

      if (selectedAssignment?.trailer?.trailerNumber === trailerNumber) {
        setSelection({ spaceKey: selection.spaceKey, type: 'space' });
      }
    }

    setMoveTaskSelectionOverride(null);
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

      return {
        ...current,
        [spaceKey]: {
          ...assignment,
          state: 'issue',
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

  const selectedBuilding =
    selection?.type === 'building' || selection?.type === 'dock'
      ? buildings.find((building) => building.id === selection.buildingId) ?? null
      : null;
  const selectedDock =
    selection?.type === 'dock'
      ? selectedBuilding?.docks.find((dock) => dock.id === selection.dockId) ?? null
      : null;
  const selectedRow = selection?.type === 'row' ? rows.find((row) => row.id === selection.rowId) ?? null : null;
  const selectedSpaceAssignment =
    selection?.type === 'space' ? operationsAssignments[selection.spaceKey] ?? null : null;
  const selectedMoveTaskTrailerNumber =
    moveTaskSelectionOverride ??
    (selection?.type === 'space' && selectedSpaceAssignment?.state === 'move-task'
      ? selectedSpaceAssignment.trailer?.trailerNumber ?? null
      : null);
  const selectedMoveTaskAssignments =
    selectedMoveTaskTrailerNumber === null
      ? []
      : Object.values(operationsAssignments).filter(
          (assignment) =>
            assignment.state === 'move-task' && assignment.trailer?.trailerNumber === selectedMoveTaskTrailerNumber
        );
  const selectedMoveTaskSpaceKeys = new Set(selectedMoveTaskAssignments.map((assignment) => assignment.key));
  const draggedSpaceKey = spaceDrag?.sourceSpaceKey ?? null;
  const dragPreviewAssignment =
    spaceDrag && appMode === 'operations' ? operationsAssignments[spaceDrag.sourceSpaceKey] ?? null : null;
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

  useEffect(() => {
    if (appMode !== 'operations' || selectedMoveTaskTrailerNumber === null) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setMoveTaskConnectionRefresh((current) => current + 1);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [appMode, operationsAssignments, selectedMoveTaskTrailerNumber]);

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
      <section className="facility-shell">
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
                    <button className="action-menu__item" onClick={() => handleModeChange('build')} type="button">
                      Edit
                    </button>
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

            <div className="canvas-viewport-controls">
              <button
                className="canvas-viewport-controls__button"
                onClick={() => setViewport((current) => ({ ...current, scale: Math.max(0.35, current.scale * 0.9) }))}
                type="button"
              >
                -
              </button>
              <div className="canvas-viewport-controls__value">{Math.round(viewport.scale * 100)}%</div>
              <button
                className="canvas-viewport-controls__button"
                onClick={() => setViewport((current) => ({ ...current, scale: Math.min(2.5, current.scale * 1.1) }))}
                type="button"
              >
                +
              </button>
              <button
                className="canvas-viewport-controls__reset"
                onClick={() => setViewport({ scale: 1, x: 0, y: 0 })}
                type="button"
              >
                Reset
              </button>
            </div>

            {moveTaskConnectionPath ? (
              <svg className="move-task-connection" role="presentation">
                <path className="move-task-connection__path" d={moveTaskConnectionPath} />
              </svg>
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
                    operationsAssignments={operationsAssignments}
                    registerSpaceControlRef={registerSpaceControlRef}
                    registerSpaceIndicatorRef={registerSpaceIndicatorRef}
                    registerSpaceRef={registerSpaceRef}
                    row={row}
                    selected={appMode === 'build' && selection?.type === 'row' && selection.rowId === row.id}
                    selectedMoveTaskSpaceKeys={selectedMoveTaskSpaceKeys}
                    selectedMoveTaskTrailerNumber={selectedMoveTaskTrailerNumber}
                    selectedSpaceKey={selection?.type === 'space' ? selection.spaceKey : null}
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

                            return (
                              <Dock
                                controlRef={(node) => registerSpaceControlRef(spaceKey, node)}
                                draggable={
                                  appMode === 'operations' &&
                                  assignment?.type === 'dock' &&
                                  assignment.state === 'move-task' &&
                                  Boolean(assignment.trailer)
                                }
                                dropHovered={dockDragHover?.spaceKey === spaceKey}
                                edge={dockPlacement.edge}
                                hideMoveIndicator={selectedMoveTaskSpaceKeys.has(spaceKey)}
                                indicatorRef={(node) => registerSpaceIndicatorRef(spaceKey, node)}
                                key={dock}
                                label={dock}
                                onDrag={handleSpaceDragMove}
                                onDragEnd={handleSpaceDragEnd}
                                onDragLeave={() => {
                                  setDockDragHover((current) => (current?.spaceKey === spaceKey ? null : current));
                                }}
                                onDragOver={(event) => {
                                  const sourceKey = spaceDrag?.sourceSpaceKey;
                                  const targetAssignment = operationsAssignments[spaceKey];
                                  const sourceAssignment = sourceKey ? operationsAssignments[sourceKey] : null;

                                  if (
                                    appMode === 'operations' &&
                                    (
                                      (sourceAssignment?.type === 'yard' && sourceAssignment.state !== 'move-task') ||
                                      (sourceAssignment?.type === 'dock' && sourceAssignment.state === 'move-task')
                                    ) &&
                                    sourceAssignment.trailer &&
                                    targetAssignment?.type === 'dock' &&
                                    targetAssignment.state === 'default'
                                  ) {
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = 'move';
                                    setDockDragHover({ edge: dockPlacement.edge, spaceKey });
                                    setDragPreviewEdge(dockPlacement.edge);
                                    setDragPreviewFollowsSourceAngle(false);
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
                                }
                                spaceRef={(node) => {
                                  spaceRefs.current[spaceKey] = node;
                                }}
                                state={visualState}
                                trailerNumber={trailerNumber}
                                type="dock"
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
                    operationsAssignments={operationsAssignments}
                    registerSpaceControlRef={registerSpaceControlRef}
                    registerSpaceIndicatorRef={registerSpaceIndicatorRef}
                    registerSpaceRef={registerSpaceRef}
                    row={previewRow}
                    selected={false}
                    selectedMoveTaskSpaceKeys={new Set()}
                    selectedMoveTaskTrailerNumber={null}
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
          </div>
        </div>

        <aside className="details-panel">
          <header className="details-panel__header">
            <h1>{panelTitle}</h1>
            <button className="details-panel__close" type="button">
              ×
            </button>
          </header>

          <div className="details-panel__body">
            {appMode === 'operations' ? (
              selectedSpaceAssignment ? (
                <>
                  <Field label="Location">
                    <div className="details-panel__selection-count">
                      {selectedSpaceAssignment.locationName} · {selectedSpaceAssignment.groupName}
                    </div>
                  </Field>
                  <Field label="Space">
                    <div className="details-panel__selection-count">{selectedSpaceAssignment.slotLabel}</div>
                  </Field>
                  <Field label="State">
                    <div className="details-panel__selection-count">{selectedSpaceAssignment.state}</div>
                  </Field>
                  {selectedSpaceAssignment.trailer ? (
                    <>
                      <Field label="Trailer Number">
                        <div className="details-panel__selection-count">
                          {selectedSpaceAssignment.trailer.trailerNumber}
                        </div>
                      </Field>
                      <Field label="Carrier Name">
                        <div className="details-panel__selection-count">
                          {selectedSpaceAssignment.trailer.carrierName}
                        </div>
                      </Field>
                      <Field label="USDOT Number">
                        <div className="details-panel__selection-count">
                          {selectedSpaceAssignment.trailer.usdotNumber}
                        </div>
                      </Field>
                      <Field label="Arrival Time">
                        <div className="details-panel__selection-count">
                          {selectedSpaceAssignment.trailer.arrivalTime}
                        </div>
                      </Field>
                      <Field label="Dock Assignment Time">
                        <div className="details-panel__selection-count">
                          {selectedSpaceAssignment.trailer.dockAssignmentTime}
                        </div>
                      </Field>
                      <Field label="Driver Name">
                        <div className="details-panel__selection-count">
                          {selectedSpaceAssignment.trailer.driverName}
                        </div>
                      </Field>
                      <Field label="Driver Phone">
                        <div className="details-panel__selection-count">
                          {selectedSpaceAssignment.trailer.driverPhone}
                        </div>
                      </Field>
                    </>
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
                  className={['panel-button', 'panel-button--wide', 'panel-button--disabled'].join(' ')}
                  disabled
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
            <span />
          </footer>
        </aside>
      </section>
      {dragPreviewAssignment && dragPreviewEdge && spaceDrag ? (
        <div
          className="space-drag-preview"
          style={{
            left: `${spaceDrag.pointerX}px`,
            top: `${spaceDrag.pointerY}px`,
            transform: `translate(-50%, -50%) rotate(${dragPreviewFollowsSourceAngle ? spaceDrag.sourceAngle : 0}deg)`,
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
      {selectedYardMoveTaskAssignment && selectedYardMoveTaskBounds ? (
        <div
          className="move-task-popover"
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
      {selectedDockAvailabilityAssignment && selectedDockAvailabilityBounds ? (
        <div
          className="move-task-popover"
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
      {selectedInProgressAssignment && selectedInProgressBounds ? (
        <div
          className="move-task-popover"
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
  rotateLabel = false,
  selected = false,
  spaceRef,
  state = 'default',
  trailerNumber,
  type = 'dock',
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
  rotateLabel?: boolean;
  selected?: boolean;
  spaceRef?: (node: HTMLDivElement | null) => void;
  state?: SpaceVisualState;
  trailerNumber?: string | null;
  type?: 'dock' | 'yard';
}) {
  return (
    <div
      className={[
        'dock',
        `dock--${edge}`,
        `dock--kind-${type}`,
        `dock--state-${state}`,
        selected ? 'dock--status-selected' : 'dock--status-default',
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
    >
      <div className="dock__inner">
        <div className="dock__head">
          <span className="dock__head-frame" />
          <span className={['dock__label', rotateLabel ? 'dock__label--rotated' : ''].filter(Boolean).join(' ')}>
            {label}
          </span>
        </div>
        <div className="dock__body">
          {trailerNumber ? (
            <span className={['dock__trailer', rotateLabel ? 'dock__trailer--rotated' : ''].filter(Boolean).join(' ')}>
              {trailerNumber}
            </span>
          ) : null}
          {state === 'move-task' ? (
            <span
              className={[
                'dock__indicator',
                'dock__indicator--arrow',
                type === 'dock' ? 'dock__indicator--arrow-dock' : 'dock__indicator--arrow-yard',
                hideMoveIndicator ? 'dock__indicator--hidden' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              ref={indicatorRef}
            >
              ↓
            </span>
          ) : null}
          {state === 'move-task' ? (
            <span aria-hidden="true" className="dock__curve-control" ref={controlRef} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ParkingRowView({
  appMode,
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
  operationsAssignments,
  registerSpaceControlRef,
  registerSpaceIndicatorRef,
  registerSpaceRef,
  row,
  selected,
  selectedMoveTaskSpaceKeys,
  selectedMoveTaskTrailerNumber,
  selectedSpaceKey,
}: {
  appMode: AppMode;
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
  operationsAssignments: OperationsAssignments;
  registerSpaceControlRef: (spaceKey: string, node: HTMLSpanElement | null) => void;
  registerSpaceIndicatorRef: (spaceKey: string, node: HTMLSpanElement | null) => void;
  registerSpaceRef: (spaceKey: string, node: HTMLDivElement | null) => void;
  row: ParkingRow;
  selected: boolean;
  selectedMoveTaskSpaceKeys: Set<string>;
  selectedMoveTaskTrailerNumber: string | null;
  selectedSpaceKey: string | null;
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
                  draggable={appMode === 'operations' && assignment?.type === 'yard' && Boolean(assignment?.trailer)}
                  edge={rowEdge}
                  hideMoveIndicator={selectedMoveTaskSpaceKeys.has(spaceKey)}
                  indicatorRef={(node) => registerSpaceIndicatorRef(spaceKey, node)}
                  key={`${row.id}-${slot}`}
                  label={slot}
                  onDrag={onSpaceDragMove}
                  onDragEnd={onSpaceDragEnd}
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
                  rotateLabel={row.settings.rotateLabels}
                  selected={
                    draggedSpaceKey === spaceKey ||
                    selectedSpaceKey === spaceKey ||
                    (selectedMoveTaskTrailerNumber !== null &&
                      assignment?.state === 'move-task' &&
                      assignment.trailer?.trailerNumber === selectedMoveTaskTrailerNumber)
                  }
                  spaceRef={(node) => registerSpaceRef(spaceKey, node)}
                  state={visualState}
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
