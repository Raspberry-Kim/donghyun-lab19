/*
** Donghyun-Re web shell glue (GPL-3.0-or-later, same as the rest of this tree).
** Lets the page start a 1-on-1 skirmish straight from seven integers, skipping
** the menus, tells the page when the battle is over or a game was saved, and
** lets the page ask for a save file to be written or loaded by number.
** Four more integers (0 or 1 each, any mix) switch on the settings kept in
** HouseClass::DhGod, DhReveal, DhRich and DhFast for the player's house.
*/
#ifndef DHWEB_H
#define DHWEB_H

struct DhStartType
{
    int Active;  // 1 = page passed -DH=...
    int Load;    // 1 = open the load dialog instead of starting a battle
    int Played;  // 1 = a battle (or load) has already been run this session
    int Me;      // 1..5 = Russia, England, Ukraine, Germany, France
    int Foe;     // 1..5 same list
    int Credits; // 500..10000
    int Tech;    // 1..10
    int Diff;    // 1..3 = computer easy, normal, hard
    int Map;     // 1..99 -> DHREnn.MPR
    int Units;   // 0..12
    int LoadNum; // with Load: >0 = load SAVEGAME.nnn straight away, 0 = open the load dialog
    int SaveReq; // >0 = the page asked to write SAVEGAME.nnn at the next turn of the main loop
    int Pause;   // 1 = the page has a menu open: the main loop waits
    int Cheat;   // bit 0 no damage, 1 open map, 2 free spending, 3 instant production (new battle only; a save file carries its own)
    int CheatDone; // 1 = Cheat has been given to the player's house
};
extern DhStartType DhStart;

/* 0 while the pointer is outside the page's game canvas (or has not moved yet): no edge scrolling then. */
extern int DhMouseInside;

/* Arrow keys the page passed on while the keyboard was on the page, not on the game: bit 0 left, 1 right, 2 up, 3 down. */
extern int DhArrow;

void Dh_Parse(int argc, char** argv);
void Dh_Notify(const char* what, int a = 0, int b = 0);
void Dh_Halt(void);
void Dh_Setup_Skirmish(void);
bool Dh_Load_Direct(int num);
void Dh_Save_Pending(void);
void Dh_Apply_Cheats(void);
#endif
