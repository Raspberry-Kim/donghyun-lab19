/*
** Donghyun-Re web shell glue (GPL-3.0-or-later, same as the rest of this tree).
** Lets the page start a 1-on-1 skirmish straight from seven integers, skipping
** the menus, and tells the page when the battle is over or a game was saved.
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
};
extern DhStartType DhStart;

/* 0 while the pointer is outside the page's game canvas (or has not moved yet): no edge scrolling then. */
extern int DhMouseInside;

void Dh_Parse(int argc, char** argv);
void Dh_Notify(const char* what, int a = 0, int b = 0);
void Dh_Halt(void);
void Dh_Setup_Skirmish(void);
#endif
