class Solution {
    public String countAndSay(int n) {
        if (n == 1) {
            return "1";
        }
       return getRle(countAndSay(n - 1)); 
    }

	public String getRle(String s) {
		// get rle
		String rle = "";

		int i =0;
		int c = 1;
		char v = 0;
		while (true) {
			if (i == s.length()) {break;}

			if (v == 0) {v = s.charAt(i);}
			i++;
			while (i < s.length() && s.charAt(i)== v) {
				i++;c++;
			}
			rle.concat(String.valueOf(c)).concat(String.valueOf(v));

			v = 0; c = 1;
		}
		return rle;
	}
}
