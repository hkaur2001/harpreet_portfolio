# Enough — Research and Competitive Landscape

## Research question

The useful question is not “does another app have a threshold?” Several products do. The research question is:

> Which part of casual group planning is still poorly served, and what product behavior would make Enough meaningfully different rather than a thinner copy of an event or scheduling app?

## Behavioral context

A January 2025 Pew Research Center survey found that among U.S. adults with close friends, 74% connect with a close friend at least a few times per week across communication channels, while only 29% see a close friend in person that often. This does not prove a scheduling product is the answer, but it supports the broader observation that frequent communication does not automatically translate into frequent in-person time.

Source: https://www.pewresearch.org/2025/01/16/where-men-and-women-turn-for-emotional-support-and-social-connection/

## Competitive map

### Partiful
**Strength:** rich event pages, invitations, RSVPs, guest management, capacity, and social event experience.

**Where it starts:** there is already an event someone is hosting.

**Enough opportunity:** operate one step earlier, when someone has an idea but does not yet want the social/organizational burden of declaring a full event.

Sources:
- https://help.partiful.com/
- https://help.partiful.com/en-us/articles/15525323-how-many-guests-can-i-invite

### Howbout
**Strength:** shared calendars, friend availability, time polls, event details, reminders, and chat.

**Where it starts:** “when are we free?” and “how do we organize a plan?”

**Enough opportunity:** focus on a different uncertainty: **“is there enough independent interest for this to be worth doing?”** Enough does not require calendar sharing to answer that question.

Sources:
- https://howbout.app/groups
- https://howbout.app/about

### Doodle / scheduling polls
**Strength:** finding a mutually available time.

**Enough opportunity:** availability is not the same as willingness. Someone can be technically free and still not want to commit unless the group reaches a meaningful size.

### InCirclo
**Strength:** private circles where events activate once enough members choose “I’m In.”

**Similarity:** minimum headcount and automatic activation are directly adjacent to Enough’s core mechanic.

**Enough differentiation:** no required persistent circle in the first-use flow; a plan begins as a lightweight shareable idea; identities are intentionally hidden during quorum and revealed only once activation makes the guest list useful.

Source: https://www.incirclo.com/

### bail.out
**Strength:** anonymous attendance polling, aggregate counts, thresholds, real-time updates, and no public individual votes.

**Similarity:** it directly addresses group-chat pressure around attendance.

**Important difference:** bail.out describes individual votes as never being shown. Enough uses **phase-based privacy**: identities are hidden while commitment is being formed, then the confirmed guest list is revealed after quorum. This is a deliberate product hypothesis, not a claim that anonymity itself is novel.

Source: https://apps.apple.com/us/app/bail-out/id6770131851

### Threshold-RSVP / quorum-style planners
Several smaller products use a minimum RSVP count to confirm or cancel plans. This validates the mechanism but also means threshold logic by itself cannot be the differentiation.

### Broader social planners
Products such as Flockify, recurring-group tools, shared-calendar apps, and private friend planners increasingly attack coordination from different angles: availability, recurring cadence, venue selection, or group activation.

The category therefore looks crowded if Enough is described as **“an app for making plans with friends.”** It becomes sharper when described as **“blind conditional commitment for casual plans.”**

## Product gap

The initial wedge is the combination of five behaviors:

| Product behavior | Why it matters |
| --- | --- |
| Soft-hosted idea | The proposer is testing a possibility, not declaring a full event. |
| Blind quorum | People see momentum without seeing who created it. |
| Host pledge hidden too | The host cannot anchor the vote with “I’m already going either way” unless the plan confirms. |
| Automatic confirmation | The threshold, not the host’s second decision, determines when the plan becomes real. |
| Post-quorum reveal | The guest list appears only once identities are useful for logistics and anticipation. |

The short-horizon defaults—tonight, tomorrow, this weekend—reinforce that positioning.

## Hypotheses that still need real user evidence

The following are **hypotheses**, not established facts:

1. Visible names before quorum suppress honest responses for some friend groups.
2. Hiding identities increases response rate or decreases time-to-response.
3. Hosts are more willing to propose ideas when an unfilled plan expires automatically.
4. Revealing names after confirmation feels better than permanent anonymity because participants want to know who will actually be there.
5. A numeric threshold is intuitive enough that it does not require lengthy explanation.

These should be tested with real groups before expanding the product around them.

## Discovery plan

### Interviews
Recruit 12–15 adults who regularly coordinate social plans across at least two distinct friend groups. Include both frequent organizers and people who rarely initiate.

Ask about the last **specific** plan that failed, rather than asking “would you use this?” Questions:

- Who first proposed it?
- When did it stop moving forward?
- What information were you waiting for?
- Did anyone explicitly cancel it?
- Did people know who else was interested?
- Would you have responded differently if your RSVP were hidden temporarily?
- What would have made the proposer willing to try again sooner?

### Diary study
For two weeks, ask participants to capture real planning threads when they occur. Tag friction as:

- time uncertainty;
- location uncertainty;
- turnout uncertainty;
- organizer fatigue;
- social-pressure / “who else is going?” behavior;
- plan forgotten or never formally cancelled.

### Prototype test
Give groups two otherwise identical plan links:

- **Variant A:** yes count + participant names visible before confirmation;
- **Variant B:** yes count visible, identities hidden until confirmation.

Measure behavior rather than only stated preference.

## Positioning statement

> **Enough is for casual plans that are only worth doing if enough friends join. Throw out the idea, let everyone commit privately, and the plan only becomes real when the threshold is reached.**

That is narrower—and more defensible—than “a better group planning app.”
