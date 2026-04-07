# PIXNET dropdown deeper probe plan

Target fields:
1. 個人分類 -> 搜尋型 dropdown -> Whisky
2. 全站分類(主要) -> 搜尋型 dropdown -> 美味食記
3. 全站分類(次要) -> 搜尋型 dropdown -> 生活綜合
4. 閱讀權限 -> 固定選單 -> 公開
5. 留言權限 -> 固定選單 -> 可留言，留言公開

Approach:
- instrument popup open state with exact DOM snapshot after each click
- capture portal/listbox/option structure
- identify whether list items are role=option / command / div rows
- test search-input selectors for searchable dropdowns
- test text-click selectors for upward popup menus
