<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the fighting experience in a client-only home route; canvas and audio require browser APIs.
- Keep combat rules and roster data in src/game, with menu and progression in FightGame; simulation must use a fixed 60 Hz timestep.
- Use hosted asset pointers for imported sprites, preserve original skins, and identify expanded fighters as skin variants rather than bespoke artwork.
- Resolve exact equal-health rounds as draws without awarding either fighter a point; greater remaining health wins at time-up.
