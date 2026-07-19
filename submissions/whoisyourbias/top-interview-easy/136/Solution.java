import java.util.*;

class Solution {
    public int singleNumber(int[] nums) {
        HashMap<Integer, Integer> m = new HashMap<>();
        
        for (int i = 0; i  < nums.length; i++) {
            if (m.get(nums[i]) == null) {
                m.put(nums[i], nums[i]);
            } else {
                m.remove(nums[i]);
            }
        }

        int i = 0;
        for (int key : m.keySet()) {
            i = m.get(key);
        }

        return i;
    }
}
