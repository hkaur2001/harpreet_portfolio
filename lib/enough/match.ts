export type EnoughTimeOption = {
  id: string;
  startsAt: string;
  label?: string;
};

export type EnoughPlaceOption = {
  id: string;
  label: string;
};

export type EnoughFitResponse = {
  response: "yes" | "no";
  timeOptionIds: string[];
  placeOptionIds: string[];
};

export type EnoughFitResult = {
  interestedCount: number;
  bestFitCount: number;
  winningTimeId: string | null;
  winningPlaceId: string | null;
};

const ANY_PLACE = "__any__";

export function solveEnoughFit(
  timeOptions: EnoughTimeOption[],
  placeOptions: EnoughPlaceOption[],
  responses: EnoughFitResponse[],
): EnoughFitResult {
  const interested = responses.filter((item) => item.response === "yes");
  const places = placeOptions.length ? placeOptions : [{ id: ANY_PLACE, label: "Anywhere" }];

  let bestFitCount = 0;
  let winningTimeId: string | null = timeOptions[0]?.id ?? null;
  let winningPlaceId: string | null = placeOptions[0]?.id ?? null;

  for (const time of timeOptions) {
    for (const place of places) {
      const fitCount = interested.filter((item) => {
        if (!item.timeOptionIds.includes(time.id)) return false;
        return place.id === ANY_PLACE || item.placeOptionIds.includes(place.id);
      }).length;

      if (fitCount > bestFitCount) {
        bestFitCount = fitCount;
        winningTimeId = time.id;
        winningPlaceId = place.id === ANY_PLACE ? null : place.id;
      }
    }
  }

  return {
    interestedCount: interested.length,
    bestFitCount,
    winningTimeId,
    winningPlaceId,
  };
}

export function responseFitsWinningPlan(
  response: EnoughFitResponse,
  winningTimeId: string | null,
  winningPlaceId: string | null,
) {
  if (response.response !== "yes" || !winningTimeId) return false;
  if (!response.timeOptionIds.includes(winningTimeId)) return false;
  return winningPlaceId ? response.placeOptionIds.includes(winningPlaceId) : true;
}
