import java.util.*;

class Solution {
    public int[] intersect(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) {
            return getIntersect(nums1, nums2);
        } else {
            return getIntersect(nums2, nums1);
        }
    }

    int[] getIntersect(int[] longer, int[] shorter) {
        boolean[] lv = new boolean[longer.length];
        boolean[] sv = new boolean[shorter.length];
        LinkedList<Integer> lst = new LinkedList<>();

        for (int l = 0; l < longer.length; l++) {
            for (int s = 0; s < shorter.length; s++) {
                if (lv[l]) {
                    break;
                }

                if (sv[s]) {
                    continue;
                }
                
                if (longer[l] == shorter[s]) {
                    lst.add(longer[l]);
                    lv[l] = true;
                    sv[s] = true;            
                }
            }
        }

        int[] rtn = new int[lst.size()];

        for (int i = 0; i < lst.size(); i++) {
            rtn[i] = lst.get(i);
        }
        return rtn;
    }
}
